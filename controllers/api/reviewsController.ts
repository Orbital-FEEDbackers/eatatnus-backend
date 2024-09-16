import { Reply, Role, User } from "@prisma/client";
import { Request, Response } from "express";
import path from "path";
import client from "../../prisma/client.js";
import { transformReviewWithImageUrls, transformReviewWithPutImageUrls } from "../../utils/transformReviewWithImageUrls.js";
import { deleteManyS3Objects } from "../../utils/s3/deleteS3Object.js";
import { singletonJson, errorJson } from "../../utils/json/index.js";
import { ProfileWithImage, transformProfileWithGetImageUrl } from "../../utils/transformProfileWithImageUrl.js";

export const REVIEW_INCLUDE = {
    user: {
        omit: { email: true, firebaseId: true, stripeAccountId: true },
        include: {
            profile: { include: { image: true } }
        }
    },
    images: true,
    replies: {
        include: {
            user: {
                omit: { email: true, firebaseId: true },
                include: {
                    profile: { include: { image: true } }
                }
            }
        }
    },
};

export function reviewsControllerFactory(prisma: typeof client) {

    async function read(req: Request, res: Response): Promise<void> {
        const id: number = parseInt(req.params.id);

        const review = await prisma.review.findUnique({
            where: { id: id },
            include: REVIEW_INCLUDE
        });

        if (review === null) {
            res.status(404)
                .json(errorJson(404, "Review does not exist"));
            return;
        }

        const transformReplyWithProfileImage = async (
            reply: Reply & { user : { profile: ProfileWithImage | null } | null
        })=> ({
            ...reply,
            ...(reply.user?.profile && {user: {
                ...reply.user,
                profile: await transformProfileWithGetImageUrl(reply.user.profile)
            }})
        })

        Promise.resolve(review)
            .then(async (review) => ({
                ...review,
                replies: await Promise.all(review.replies.map(transformReplyWithProfileImage)),
            }))
            .then(transformReviewWithImageUrls)
            .then((review) => res.status(200)
                .json(singletonJson(review))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);

        const user: User = req.body.user;
        const rating: number = parseInt(req.body.rating);
        const description: string | null = req.body.description;
        const imageFilenames: string[] | undefined = req.body.imageFilenames;

        const review = await prisma.review.findUnique({
            where: { id: id },
            include: REVIEW_INCLUDE
        })

        if (!review) {
            res.status(404)
                .json(errorJson(404, "Review does not exist"));
            return;
        }

        if (!rating || imageFilenames === undefined) {
            res.status(400).json(errorJson(400, {
                rating: "Required and must be a number",
                imageFilenames: "Required",
            }));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== review.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        const uploadedImages = review.images;
        const s3KeysToBeDeleted = uploadedImages.map(image => image.s3Key)
            .filter(s3Key => !imageFilenames.includes(path.basename(s3Key)));

        Promise.all(
            [
                prisma.image.deleteMany(
                    {
                        where: {
                            s3Key: { in: s3KeysToBeDeleted }
                        }
                    }
                ),
                deleteManyS3Objects(s3KeysToBeDeleted)
            ]
        )
            .then(() => prisma.review.update(
                {
                    where: { id: id },
                    data: {
                        rating: rating,
                        description: description,
                        images: {
                            createMany: {
                                data: imageFilenames.map(filename => (
                                    {
                                        s3Key: `reviews/${review.id}/${filename}`
                                    }
                                )),
                                skipDuplicates: true
                            }
                        }
                    },
                    include: REVIEW_INCLUDE,
                }
            ))
            .then(review => transformReviewWithPutImageUrls(
                {
                    ...review,
                    images: review.images.filter(image => !uploadedImages.includes(image))
                }
            ))
            .then(review => res.status(200)
                .json(singletonJson(review, "Review successfully updated"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);

        const user: User = req.body.user;

        const review = await prisma.review.findUnique({
            where: { id: id },
            include: REVIEW_INCLUDE
        });

        if (!review) {
            res.status(404)
                .json(errorJson(404, "Review does not exist"));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== review.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        Promise.all(
            [
                prisma.review.delete({ where: { id: id } }),
                deleteManyS3Objects(review.images.map(image => image.s3Key))
            ]
        )
            .then(() => res.status(200)
                .json(singletonJson(null, "Review successfully deleted"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createReply(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        const user: User = req.body.user;
        const body: string | undefined = req.body.body;
        const replyId: number | null = req.body.replyId !== undefined
            ? parseInt(req.body.replyId)
            : null;

        if (!body) {
            res.status(400)
                .json(errorJson(400, { body: "Required: string"}));
            return;
        }

        prisma.review.update({
            where: { id: id },
            data: {
                replies: {
                    create: {
                        body: body,
                        user: {
                            connect: {id: user.id }
                        },
                        ...(replyId !== null && { parent: {
                            connect: { id: replyId }
                        }})
                    }
                }
            },
            include: REVIEW_INCLUDE
        })
            .then(async (review) => {
                if (replyId !== null) {
                    const parentReply = await prisma.reply.findUnique({ where: { id: replyId } });
                    return { userId: parentReply?.userId ?? null, review };
                }
                return { userId: review.userId, review};
            })
            .then(({ userId, review }) => {
                if (userId === null) {
                    return;
                }
                return prisma.notification.create({
                    data: {
                        user: { connect: { id: userId } },
                        review: { connect: { id: review.id } },
                        message: `${user.name} replied to your ${replyId !== null ? "reply" : "review"}`
                    }
                })
            })
            .then(() => res.status(200)
                .json(singletonJson(null, "Reply successfully created"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function updateReply(req: Request, res: Response) {
        const user: User = req.body.user;
        const replyId: number = parseInt(req.body.replyId);
        const body: string | undefined = req.body.body;

        if (!body || !replyId) {
            res.status(400)
                .json(errorJson(400, {
                    body: "Required: string",
                    replyId: "Required: number"
                }));
            return;
        }

        const reply = await prisma.reply.findUnique({
            where: { id: replyId }
        });

        if (!reply) {
            res.status(404)
                .json(errorJson(404, "Reply does not exist"));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== reply.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        prisma.reply.update({
            where: { id: replyId },
            data: {
                body: body
            },
        })
            .then(() => res.status(200)
                .json(singletonJson(null, "Reply successfully updated"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function deleteReply(req: Request, res: Response) {
        const user: User = req.body.user;
        const replyId: number = parseInt(req.body.replyId);
        
        if (!replyId) {
            res.status(400)
                .json(errorJson(400, { replyId: "Required: number" }));
            return;
        }

        const reply = await prisma.reply.findUnique({
            where: { id: replyId }
        });

        if (!reply) {
            res.status(404)
                .json(errorJson(404, "Reply does not exist"));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== reply.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        prisma.reply.delete({
            where: { id: replyId }
        })
            .then(() => res.status(200)
                .json(singletonJson(null, "Reply successfully deleted"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    return {
        read,
        update,
        destroy,
        createReply,
        updateReply,
        deleteReply
    };
}

export const {
    read,
    update,
    destroy,
    createReply,
    updateReply,
    deleteReply
} = reviewsControllerFactory(client);