import { Request, Response } from "express";
import { User, CaloricTracker, Role, Food, Prisma, FoodsOnCaloricTrackerEntries } from "@prisma/client";
import client from "../../prisma/client.js";
import { collectionJson, errorJson, singletonJson } from "../../utils/json/index.js";
import transformMenuItemsWithNutritionalInfo from "../../utils/transformMenuItemsWithNutritionalInfo.js";
import { uniqBy } from "lodash-es";

export const CALORIC_TRACKER_ENTRY_INCLUDE = {
    foods: {
        include: { food: true },
        orderBy: { createdAt: Prisma.SortOrder.asc }
    }
}
export const CALORIC_TRACKER_INCLUDE = {
    caloricTrackerEntries: {
        include: CALORIC_TRACKER_ENTRY_INCLUDE,
        orderBy: { createdAt: Prisma.SortOrder.desc }
    }
}

export function caloricTrackerControllerFactory(prisma: typeof client) {

    async function index(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;

        const caloricTracker: CaloricTracker | null = await prisma.caloricTracker.findUnique(
            {
                where: { userId: user.id },
                include: CALORIC_TRACKER_INCLUDE
            }
        );

        res.status(200)
            .json(singletonJson(caloricTracker));
    }

    async function create(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;

        prisma.caloricTracker.create(
            {
                data: { userId: user.id },
                include: CALORIC_TRACKER_INCLUDE
            }
        )
            .then(caloricTracker => res.status(201)
                .json(singletonJson(caloricTracker, "Caloric tracker created successfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            )
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;

        const caloricTracker = await prisma.caloricTracker.findUnique(
            { where: { userId: user.id } }
        )

        if (caloricTracker === null) {
            res.status(404)
                .json(errorJson(404, "Caloric tracker not found"));
            return;
        }

        prisma.caloricTracker.delete(
            {
                where: { id: caloricTracker.id }
            }
        )
            .then(() => res.status(200)
                .json(singletonJson(null, "Caloric tracker successfully deleted"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createEntry(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        const items: { food: Omit<Food, "id">; count?: number }[] | undefined = req.body.items;

        if (items === undefined) {
            res.status(400).json(errorJson(400, {
                items: "Required",
            }));
            return;
        }

        const caloricTracker =
            await prisma.caloricTracker.findUnique(
                {
                    where: { userId: user.id },
                    include: {
                        caloricTrackerEntries: {
                            include: { foods: true }
                        }
                    }
                }
            );

        if (caloricTracker === null) {
            res.status(404)
                .json(errorJson(404, "Caloric tracker not found"));
            return;
        }

        if (user.id !== caloricTracker.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        const newItemsToConnect: { food: Food, count?: number }[] = uniqBy(
            items.filter(item => "id" in item.food)
                .map(item => item as { food: Food, count?: number }),
            (item) => item.food.id
        );

        const newItemsToCreate: { food: Omit<Food, "id">, count?: number }[] =
            items.filter(item => !("id" in item.food))

        const newItemsToCreateWithNutritionalInformation: { food: Omit<Food, "id">, count?: number }[] =
            await transformMenuItemsWithNutritionalInfo(newItemsToCreate.map(item => item.food))
                .then(newItems =>
                    newItems.map((item, index) => ({
                        food: item, count: newItemsToCreate[index].count
                    }))
                );

        prisma.caloricTrackerEntry.create(
            {
                data: {
                    caloricTracker: {
                        connect: { id: caloricTracker.id }
                    },
                    foods: {
                        create: [
                            ...newItemsToConnect.map(item => ({
                                food: { connect: { id: item.food.id } },
                                count: item.count
                            })),
                            ...newItemsToCreateWithNutritionalInformation.map(item => ({
                                food: { create: item.food },
                                count: item.count
                            }))
                        ]
                    }
                },
                include: CALORIC_TRACKER_ENTRY_INCLUDE
            }
        )
            .then(caloricTrackerEntry => res.status(200)
                .json(singletonJson(caloricTrackerEntry, "CaloricTrackerEntry successfully created"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function updateEntry(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        const caloricTrackerEntryId: number = parseInt(req.body.caloricTrackerEntryId);
        const items: FoodsOnCaloricTrackerEntries[] | undefined = req.body.items;
        const newItems: { food: Omit<Food, "id">, count?: number }[] = req.body.newItems ?? [];

        if (Number.isNaN(caloricTrackerEntryId) || items === undefined) {
            res.status(400).json(errorJson(400, {
                caloricTrackerEntryId: "Required",
                items: "Required",
                newItems: "Optional"
            }));
            return;
        }

        const caloricTrackerEntry =
            await prisma.caloricTrackerEntry.findUnique(
                {
                    where: { id: caloricTrackerEntryId },
                    include: { ...CALORIC_TRACKER_ENTRY_INCLUDE, caloricTracker: true }
                }
            );

        if (caloricTrackerEntry === null) {
            res.status(404)
                .json(errorJson(404, "CaloricTrackerEntry not found"));
            return;
        }

        if (user.id !== caloricTrackerEntry.caloricTracker.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        const editedItems: FoodsOnCaloricTrackerEntries[] =
            items.filter(item => caloricTrackerEntry.foods.some(
                x => x.foodId === item.foodId &&
                    x.caloricTrackerEntryId === item.caloricTrackerEntryId &&
                    x.count !== item.count)
            )

        const deletedItems: FoodsOnCaloricTrackerEntries[] = caloricTrackerEntry.foods
            .filter(item => items
                .every(input =>
                    item.foodId !== input.foodId ||
                    item.caloricTrackerEntryId !== input.caloricTrackerEntryId
                )
            )
            .map(item => ({
                // Prisma disconnect does not work with composite keys
                count: item.count,
                foodId: item.foodId,
                caloricTrackerEntryId: item.caloricTrackerEntryId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

        const newItemsToConnect: { food: Food, count?: number }[] =
            uniqBy(
                newItems.filter(item => "id" in item.food)
                    .map(item => item as { food: Food, count?: number }),
                (item) => item.food.id
            )
            .filter(item => caloricTrackerEntry.foods.every(x => x.foodId !== item.food.id));
        
        const newItemsToCreate: { food: Omit<Food, "id">, count?: number }[] =
            newItems.filter(item => !("id" in item.food));

        const newItemsToCreateWithNutritionalInformation: { food: Omit<Food, "id">, count?: number }[] =
            await transformMenuItemsWithNutritionalInfo(
                newItemsToCreate.map(item => item.food)
            )
                .then(newItems =>
                    newItems.map((item, index) => ({
                        food: item, count: newItemsToCreate[index].count
                    }))
                );

        prisma.caloricTrackerEntry.update(
            {
                where: { id: caloricTrackerEntryId },
                data: {
                    foods: {
                        update: editedItems.map(item => ({
                            where: {
                                foodId_caloricTrackerEntryId: {
                                    foodId: item.foodId,
                                    caloricTrackerEntryId: item.caloricTrackerEntryId
                                }
                            },
                            data: { count: item.count }
                        })),
                        deleteMany: deletedItems,
                        create: [
                            ...newItemsToConnect.map(item => ({
                                food: { connect: { id: item.food.id } },
                                count: item.count
                            })),
                            ...newItemsToCreateWithNutritionalInformation.map(item => ({
                                food: { create: item.food },
                                count: item.count
                            }))
                        ]
                    }
                },
                include: CALORIC_TRACKER_ENTRY_INCLUDE
            }
        )
            .then(caloricTrackerEntry => res.status(200)
                .json(singletonJson(caloricTrackerEntry, "CaloricTrackerEntry successfully updated"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function destroyEntry(req: Request, res: Response): Promise<void> {
        const user: User = req.body.user;
        const caloricTrackerEntryId: number = parseInt(req.body.caloricTrackerEntryId);

        if (Number.isNaN(caloricTrackerEntryId)) {
            res.status(400)
                .json(errorJson(400, { caloricTrackerEntryId: "Required" }));
            return;
        }

        const caloricTrackerEntry =
            await prisma.caloricTrackerEntry.findUnique(
                {
                    where: { id: caloricTrackerEntryId },
                    include: { caloricTracker: true }
                }
            );

        if (caloricTrackerEntry === null) {
            res.status(404)
                .json(errorJson(404, "CaloricTrackerEntry not found"));
            return;
        }

        if (user.role !== Role.ADMIN &&
            user.id !== caloricTrackerEntry.caloricTracker.userId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        prisma.caloricTrackerEntry.delete(
            {
                where: { id: caloricTrackerEntry.id }
            }
        )
            .then(() => res.status(200)
                .json(singletonJson(null, "CaloricTrackerEntry successfully deleted"))
            )
            .catch(error => {
                console.log(error); res.status(500)
                    .json(errorJson(500, error))
            }
            );
    }

    async function search(req: Request, res: Response): Promise<void> {
        const q: string | undefined = req.query.q?.toString();
        const limit: number | undefined = req.query.limit
            ? parseInt(req.query.limit.toString())
            : undefined;

        if (q === undefined) {
            res.status(200)
                .json(collectionJson([], "No search query provided"));
            return;
        }

        try {
            const foods = await prisma.food.findMany({
                where: {
                    name: {
                        // Allow for spaces in query, otherwise error
                        // https://github.com/prisma/prisma/issues/10481#issuecomment-1329714105
                        search: q.trim().split(" ").join(" & ")
                    }
                }
            })
                .then((foods) => limit !== undefined ? foods.slice(0, limit) : foods);

            res.status(200)
                .json(collectionJson(foods, `Food search results for ${q}`));
        } catch (error) {
            res.status(500)
                .json(errorJson(500, error instanceof Error ? error.message : error));
        }
    }

    return {
        index,
        create,
        destroy,
        createEntry,
        updateEntry,
        destroyEntry,
        search
    };
}

export const {
    index,
    create,
    destroy,
    createEntry,
    updateEntry,
    destroyEntry,
    search
} = caloricTrackerControllerFactory(client);