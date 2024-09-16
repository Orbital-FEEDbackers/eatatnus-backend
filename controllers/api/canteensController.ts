import { User, Role, ReviewType, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import getGeoCoordinates from "../../utils/getGeoCoordinates.js";
import {
    transformReviewWithPutImageUrls,
    transformReviewsWithImageUrls
} from "../../utils/transformReviewWithImageUrls.js";
import { REVIEW_INCLUDE } from "./reviewsController.js";
import client from "../../prisma/client.js";
import { collectionJson, singletonJson, errorJson } from "../../utils/json/index.js";


export const CANTEEN_INCLUDE = {
    location: true,
    reviews: {
        include: REVIEW_INCLUDE,
        orderBy: { id: Prisma.SortOrder.desc }
    }
};

export function canteensControllerFactory(prisma: typeof client) {
    async function index(req: Request, res: Response): Promise<void> {
        prisma.canteen.findMany({ include: CANTEEN_INCLUDE })
            .then(canteens => res.status(200)
                .json(collectionJson(canteens))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function create(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        const { name, description, address } = req.body;

        if (user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (!name || !address) {
            res.status(400)
                .json(errorJson(400, { name: "Required", address: "Required" }))
            return;
        }

        await prisma.location.findUnique({ where: { address: address } })
            .then(location => location
                ? { latitude: location.latitude, longitude: location.longitude }
                : getGeoCoordinates(address)
            )
            .then(({ latitude, longitude }) =>
                prisma.canteen.create({
                    data: {
                        name: name,
                        description: description,
                        location: {
                            connectOrCreate: {
                                where: { address: address },
                                create: {
                                    address: address,
                                    latitude: latitude,
                                    longitude: longitude,
                                },
                            },
                        }
                    },
                    include: CANTEEN_INCLUDE,
                })
            )
            .then(canteen => res.status(201)
                .json(singletonJson(canteen, "Canteen created successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, "Cannot create canteen \n" + error.message))
            );
    }

    async function read(req: Request, res: Response): Promise<void> {
        const id: number = parseInt(req.params.id);

        prisma.canteen.findUnique({
            where: { id: id },
            include: CANTEEN_INCLUDE
        })
            .then(async canteen => {
                if (!canteen) {
                    throw new Error("Canteen not found");
                }

                return {
                    ...canteen,
                    reviews: await transformReviewsWithImageUrls(canteen.reviews)
                }
            })
            .then(canteen => res.status(200).json(singletonJson(canteen)))
            .catch(error => res.status(500).json(errorJson(500, error.message)));
    }

    async function update(req: Request, res: Response): Promise<void> {
        const id: number = parseInt(req.params.id);
        const user: User = req.body.user;
        const { name, description, address } = req.body;

        if (user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (!name || !address) {
            res.status(400)
                .json(errorJson(400, { name: "Required", address: "Required" }));
            return;
        }

        await prisma.location.findUnique({ where: { address: address ?? "" } })
            .then(location => location
                ? { latitude: location.latitude, longitude: location.longitude }
                : getGeoCoordinates(address)
            )
            .then(({ latitude, longitude }) =>
                prisma.canteen.update({
                    where: { id: id },
                    data: {
                        name: name,
                        description: description,
                        location: {
                            connectOrCreate: {
                                where: { address: address },
                                create: {
                                    address: address,
                                    latitude: latitude,
                                    longitude: longitude,
                                },
                            },
                        }
                    },
                    include: CANTEEN_INCLUDE,
                })
            )
            .then(canteen => res.status(200)
                .json(singletonJson(canteen, "Canteen updated successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const id: number = parseInt(req.params.id);
        const user: User = req.body.user;

        if (user.role !== Role.ADMIN) {
            res.status(403).json(errorJson(403, "Unauthorized"));
            return;
        }

        prisma.canteen.delete({ where: { id: id } })
            .then(canteen => res.status(200)
                .json(singletonJson(null, "Canteen deleted successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createReview(req: Request, res: Response): Promise<void> {
        const canteenId: number = parseInt(req.params.id);

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

        await prisma.review.create({
            data: {
                canteen: {
                    connect: { id: canteenId }
                },
                reviewType: ReviewType.OutletReview,
                rating: rating,
                description: description,
                user: {
                    connect: { id: user.id }
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
                                    s3Key: `reviews/${review.id}/${filename}`
                                }
                            ))
                        }
                    }
                },
                include: REVIEW_INCLUDE
            }))
            .then(transformReviewWithPutImageUrls)
            .then(review => res.status(201)
                .json(singletonJson(review, "Canteen review successfully created"))
            )
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
        createReview
    };
}

export const {
    index,
    create,
    read,
    update,
    destroy,
    createReview
} = canteensControllerFactory(client);