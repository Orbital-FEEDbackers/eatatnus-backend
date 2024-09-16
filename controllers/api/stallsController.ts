import { Prisma, ReviewType, Role, User } from "@prisma/client";
import { Request, Response } from "express";
import client from "../../prisma/client.js";
import { transformReviewWithPutImageUrls, transformReviewsWithImageUrls } from "../../utils/transformReviewWithImageUrls.js";
import { REVIEW_INCLUDE } from "./reviewsController.js";
import { singletonJson, collectionJson, errorJson } from "../../utils/json/index.js";


export const STALL_INCLUDE = {
    canteen: true,
    reviews: {
        include: REVIEW_INCLUDE,
        orderBy: { id: Prisma.SortOrder.desc }
    },
    menu: { include: { items: true } }
}

export function stallsControllerFactory(prisma: typeof client) {

    function index(req: Request, res: Response): void {
        prisma.stall.findMany({
            include: STALL_INCLUDE
        })
            .then(stalls => res.status(200).json(collectionJson(stalls)))
            .catch(error => res.status(500).json(errorJson(500, error.message)));
    }

    function create(req: Request, res: Response): void {
        const { user, name, description, canteenId } = req.body;

        if (!name || !canteenId) {
            res.status(400).json(errorJson(400, {
                name: "Required",
                canteenId: "Required and must be a number"
            }));
            return;
        }

        prisma.stall.create({
            data: {
                name: name,
                description: description,
                canteen: {
                    connect: { id: canteenId }
                }
            },
            include: STALL_INCLUDE
        })
            .then(stall => res.status(201)
                .json(singletonJson(stall, "Stall created successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function read(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);

        await prisma.stall.findUnique({
            where: { id: id },
            include: STALL_INCLUDE
        })
            .then(async stall => {
                if (!stall) {
                    throw new Error("Stall not found");
                }

                return {
                    ...stall,
                    reviews: await transformReviewsWithImageUrls(stall.reviews)
                }
            })
            .then(stall => res.status(200)
                .json(singletonJson(stall))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function update(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const { user, name, description } = req.body;

        const ownerId = await prisma.stall.findUnique({ where: { id: id } })
            .then(stall => stall?.ownerId);

        if (user.role !== Role.ADMIN && user.id !== ownerId) {
            res.status(403).json(errorJson(403, "Unauthorized"));
            return;
        }

        if (!name) {
            res.status(400)
                .json(errorJson(400, { name: "Required" }));
            return;
        }

        await prisma.stall.update({
            where: { id: id },
            data: {
                name: name,
                description: description,
                canteen: {
                    connect: {
                        name: req.body.canteenName
                    }
                }
            },
            include: STALL_INCLUDE
        })
            .then(stall => res.status(200)
                .json(singletonJson(stall, "Stall updated successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const { user } = req.body;

        const ownerId = await prisma.stall.findUnique({ where: { id: id } })
            .then(stall => stall?.ownerId);

        if (user.role !== Role.ADMIN && user.id !== ownerId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        await prisma.stall.delete({ where: { id: id } })
            .then(() => res.status(200)
                .json(singletonJson(null, "Stall deleted successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function assignOwner(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        const id = parseInt(req.params.id);
        const ownerId = parseInt(req.body.ownerId);

        if (!ownerId) {
            res.status(400)
                .json(errorJson(400, { ownerId: "Required" }));
            return;
        }

        if (user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        await prisma.stall.update({
            where: { id: id },
            data: { ownerId: ownerId },
            include: STALL_INCLUDE
        })
            .then(stall => res.status(200)
                .json(singletonJson(stall, "Owner assigned successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createReview(req: Request, res: Response): Promise<void> {
        const stallId: number = parseInt(req.params.id);

        const user: User = req.body.user;
        const rating: number = parseInt(req.body.rating);
        const description: string | null = req.body.description;
        const imageFilenames: string[] = req.body.imageFilenames ?? [];

        if (!rating) {
            res.status(400).json(errorJson(400, {
                rating: "Required: number",
                description: "Optional: string | null",
                imageFilenames: "Optional: string[]"
            }));
            return;
        }

        const stall = await prisma.stall.findUnique({ where: { id: stallId } });

        if (!stall) {
            res.status(404).json(errorJson(404, "Stall not found"));
            return;
        }

        await prisma.review.create({
            data: {
                stall: {
                    connect: {
                        id: stallId,
                    }
                },
                reviewType: ReviewType.StallReview,
                rating: rating,
                description: description,
                user: {
                    connect: {
                        id: user.id,
                    }
                }
            }
        })
            .then(review => prisma.review.update({
                where: { id: review.id },
                data: {
                    images: {
                        createMany: {
                            data: imageFilenames.map(filename => (
                                {
                                    // requires review id to be created first
                                    s3Key: `reviews/${review.id}/${filename}`
                                }
                            ))
                        }
                    }
                },
                include: REVIEW_INCLUDE
            }))
            .then(transformReviewWithPutImageUrls)
            .then(async (review) => {
                if (stall.ownerId !== null) {
                    await prisma.notification.create({
                        data: {
                            user: { connect: { id: stall.ownerId } },
                            review: { connect: { id: review.id }},
                            message: `${user.name} has reviewed your stall ${stall.name}`
                        }
                    });
                }

                res.status(200)
                    .json(singletonJson(review, "Stall review successfully created"));
            })
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    return {
        index,
        create,
        read,
        update,
        destroy,
        assignOwner,
        createReview
    };
}

export const {
    index,
    create,
    read,
    update,
    destroy,
    assignOwner,
    createReview
} = stallsControllerFactory(client);