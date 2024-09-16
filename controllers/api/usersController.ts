import { Request, Response } from 'express';
import { errorJson, singletonJson } from '../../utils/json/index.js';
import client from "../../prisma/client.js";
import { Prisma, Role, User } from '@prisma/client';
import admin from "firebase-admin";
import { deleteS3Object } from "../../utils/s3/deleteS3Object.js";
import path from "path";
import { transformProfileWithGetImageUrl, transformProfileWithPutImageUrl } from '../../utils/transformProfileWithImageUrl.js';
import stripe from "../../stripe/client.js";

export function usersControllerFactory(prisma: typeof client) {

    async function index(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        
        prisma.user.findUniqueOrThrow(
            {
                omit: {
                    email: true,
                    firebaseId: true,
                },
                where: { id: user.id },
                include: {
                    profile: {
                        include: { image: true }
                    },
                    reviews: true,
                    notifications: {
                        include: { review: true },
                        orderBy: { id: Prisma.SortOrder.desc }
                    },
                }
            }
        )
            .then(async (user) => res.status(200)
                .json(singletonJson({
                    ...user,
                    profile: user.profile === null
                        ? user.profile
                        : await transformProfileWithGetImageUrl(user.profile)
                }))
            )
            .catch((error) => res.status(404)
                .json(errorJson(404, error.message))
            )
    }

    async function read(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);

        if (Number.isNaN(id)) {
            res.status(400)
                .json(errorJson(400, { items: "Required" }));
            return;
        }

        const user = await prisma.user.findUnique(
            {
                omit: {
                    email: true,
                    firebaseId: true,
                    stripeAccountId: true,
                },
                where: { id: id },
                include: {
                    profile: {
                        include: { image: true }
                    },
                    reviews: true,
                }
            }
        )

        if (user === null) {
            res.status(404)
                .json(errorJson(404, "User not found"));
            return;
        }

        res.status(200)
            .json(singletonJson(
                {
                    ...user,
                    profile: user.profile === null
                        ? user.profile
                        : await transformProfileWithGetImageUrl(user.profile)
                }
            ));
    }

    async function create(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        const bearerPrefix = "Bearer ";

        if (!authHeader) {
            res.status(401).json({
                error: {
                    code: 401,
                    message: "Please provide a token",
                },
            });
            return;
        }

        if (!authHeader?.startsWith(bearerPrefix)) {
            res.status(401).json({
                error: {
                    code: 401,
                    message: "Token must start with " + bearerPrefix,
                },
            });
            return;
        }

        const idToken = authHeader.substring(bearerPrefix.length, authHeader.length);

        const name: string | undefined = req.body.name;
        const bio: string | undefined = req.body.bio;
        const isBusinessAccount: boolean = String(req.body.isBusinessAccount).toLowerCase() === "true"

        admin.auth().verifyIdToken(idToken)
            .then(decodedToken =>
                prisma.user.create({
                    data: {
                        firebaseId: decodedToken.uid,
                        email: decodedToken?.email,
                        name: name ?? decodedToken?.name,
                        profile: { create: { bio: bio } },
                        ...(isBusinessAccount && { role: Role.BUSINESS })
                    },
                    include: {
                        profile: {
                            include: { image: true }
                        },
                        reviews: true,
                    }
                })
            )
            .then(async (user) => {
                if (user.role !== Role.BUSINESS) {
                    return user;
                }

                const stripeAccount = await stripe.accounts.create({
                    country: "SG",
                    email: user.email ?? undefined,
                    metadata: {
                        userId: user.id
                    }
                });

                return prisma.user.update(
                    {
                        where: { id: user.id },
                        data: {
                            stripeAccountId: stripeAccount.id
                        },
                        include: {
                            profile: {
                                include: { image: true }
                            },
                            reviews: true,
                        }
                    }
                )
            })
            .then(user => res.status(200).json(singletonJson(user)))
            .catch(error => res.status(403).json({
                error: {
                    code: 403,
                    message: "Unauthorized\n" + error,
                },
            }));
    }

    async function update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const user: User = req.body.user;

        const name: string | undefined = req.body.name;
        const email: string | undefined = req.body.email;

        if (user.role != Role.ADMIN && user.id !== id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (!name || !email) {
            res.status(400)
                .json(errorJson(400, {
                    name: "Required",
                    email: "Required"
                }));
            return;
        }

        admin.auth().updateUser(user.firebaseId, {
            email: email,
            displayName: name
        })
            .then(() => prisma.user.update(
                {
                    where: { id: id },
                    data: {
                        name: name,
                        email: email
                    },
                    include: {
                        profile: {
                            include: { image: true }
                        },
                        reviews: true,
                    }
                }
            ))
            .then(user => res.status(200).json(singletonJson(user)))
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const user: User = req.body.user;

        if (user.role != Role.ADMIN && user.id !== id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        admin.auth().deleteUser(user.firebaseId)
            .then(() => prisma.user.delete(
                {
                    where: { id: id },
                    include: {
                        profile: { include: { image: true } }
                    }
                }
            )
            )
            .then(user => {
                if (user.profile !== null && user.profile.image !== null) {
                    deleteS3Object(user.profile.image.s3Key);
                }
            })
            .then(() => res.status(200)
                .json(singletonJson(null, "User deleted successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createProfile(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const user: User = req.body.user;
        const bio: string | null = req.body.bio ?? null;
        const imageFilename: string | null = req.body.imageFilename ?? null;

        if (user.role != Role.ADMIN && user.id !== id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (prisma.profile.findUnique({ where: { userId: id } }) !== null) {
            res.status(400)
                .json(errorJson(400, "Profile already exists"));
            return;
        }

        prisma.profile.create({ data: { userId: id, bio: bio }, include: { image: true } })
            .then(profile => imageFilename === null
                ? profile
                : prisma.profile.update(
                    {
                        where: { id: profile.id },
                        data: {
                            image: {
                                create: { s3Key: `profiles/${profile.id}/${imageFilename}` }
                            }
                        },
                        include: { image: true }
                    }
                )
            )
            .then(transformProfileWithPutImageUrl)
            .then(profile => res.status(201)
                .json(singletonJson(profile, "Profile created successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function updateProfile(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const user: User = req.body.user;
        const bio: string | null = req.body.bio ?? null;
        const imageFilename: string | null = req.body.imageFilename ?? null;

        if (user.role != Role.ADMIN && user.id !== id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        const profile = await prisma.profile.findUnique({ where: { userId: id }, include: { image: true } });

        if (profile === null) {
            res.status(404)
                .json(errorJson(404, "Profile not found"));
            return;
        }

        if (profile.image && path.basename(profile.image.s3Key) !== imageFilename) {
            await Promise.all(
                [
                    deleteS3Object(profile.image.s3Key),
                    prisma.image.delete({ where: { id: profile.image.id } })
                ]
            )
        }

        prisma.profile.update(
            {
                where: { id: profile.id },
                data: {
                    bio: bio,
                    ...(imageFilename && {
                        image: {
                            connectOrCreate: {
                                where: { s3Key: `profiles/${profile.id}/${imageFilename}` },
                                create: { s3Key: `profiles/${profile.id}/${imageFilename}` },
                            }
                        }
                    })
                },
                include: { image: true }
            }
        )
            .then(transformProfileWithPutImageUrl)
            .then(profile => res.status(201)
                .json(singletonJson(profile, "Profile updated successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function updateNotification(req: Request, res: Response): Promise<void> {
        const notificationId = parseInt(req.body.notificationId);
        const user: User = req.body.user;
        const message: string | undefined = req.body.message;

        if (Number.isNaN(notificationId)) {
            res.status(400)
                .json(errorJson(400, { notificationId: "Required" }));
            return;
        }

        const notification = await prisma.notification.findUnique({ where: { id: notificationId } });

        if (notification === null) {
            res.status(404)
                .json(errorJson(404, "Notification not found"));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== notification.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        prisma.notification.update(
            {
                where: { id: notificationId },
                data: {
                    ...(user.role === Role.ADMIN && { message: message }),
                    ...(user.id === notification.userId && { read: true })
                }
            }
        )
            .then(() => res.status(200)
                .json(singletonJson(null, "Notification updated successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function destroyNotifications(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;

        prisma.notification.deleteMany({ where: { userId: user.id } })
            .then(() => res.status(200)
                .json(singletonJson(null, "Notification updated successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    return {
        index,
        read,
        create,
        update,
        destroy,
        createProfile,
        updateProfile,
        updateNotification,
        destroyNotifications
    };
}

export const {
    index,
    read,
    create,
    update,
    destroy,
    createProfile,
    updateProfile,
    updateNotification,
    destroyNotifications
} = usersControllerFactory(client);