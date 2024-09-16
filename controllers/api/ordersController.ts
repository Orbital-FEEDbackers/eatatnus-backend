import { Request, Response } from "express";
import { singletonJson, collectionJson, errorJson } from "../../utils/json/index.js";
import { Food, FoodsOnOrders, Prisma, Role, User } from "@prisma/client";
import client from "../../prisma/client.js";
import { uniqBy } from "lodash-es";

const ORDER_INCLUDE = {
    foods: {
        include: { food: true },
        orderBy: { createdAt: Prisma.SortOrder.asc }
    },
}

export function ordersControllerFactory(prisma: typeof client) {

    async function index(req: Request, res: Response) {
        const user: User = req.body.user;
        const userId: number = parseInt(req.query.userId?.toString() ?? "");

        const orders = await prisma.user.findUnique({
            where: { id: (user.role === Role.ADMIN && userId) ? userId : user.id },
            include: {
                orders: {
                    include: ORDER_INCLUDE,
                    orderBy: { updatedAt: Prisma.SortOrder.desc }
                },
                stalls: {
                    include: {
                        orders: {
                            include: ORDER_INCLUDE,
                            orderBy: { updatedAt: Prisma.SortOrder.desc }
                        }
                    }
                }
            },
        })
            .then(userData => user.role === Role.BUSINESS
                ? (userData?.stalls?.flatMap(stall => stall.orders) ?? [])
                : userData?.orders
            );

        if (orders === undefined) {
            res.status(404)
                .json(errorJson(404, "No orders found"));
            return;
        }

        res.status(200)
            .json(collectionJson(orders));
    }

    async function read(req: Request, res: Response) {
        const user: User = req.body.user;
        const orderId: number = parseInt(`${req.params.id}`);

        if (Number.isNaN(orderId)) {
            res.status(400)
                .json(errorJson(400, {
                    orderId: "Required"
                }));
            return;
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: ORDER_INCLUDE
        });

        if (!order) {
            res.status(404)
                .json(errorJson(404, "Order not found"));
            return;
        }

        if (user.role !== Role.ADMIN && order.userId !== user.id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        res.status(200)
            .json(singletonJson(order));
    }

    async function create(req: Request, res: Response) {
        const user: User = req.body.user;
        const items: { food: Food, count?: number }[] | undefined = req.body.items;
        const stallId: number = parseInt(`${req.body.stallId}`);

        if (!items || Number.isNaN(stallId)) {
            res.status(400)
                .json(errorJson(400, {
                    items: "Required",
                    stallId: "Required"
                }));
            return;
        }

        const stall = await prisma.stall.findUnique({
            where: { id: stallId },
            include: { menu: true }
        });

        if (!stall) {
            res.status(404)
                .json(errorJson(404, "Stall not found"));
            return;
        }

        if (items.some((item) => item.food.menuId !== stall.menu?.id)) {
            res.status(400)
                .json(errorJson(400, "Items do not belong to the same menu"));
            return;
        }

        const order = await prisma.order.create({
            data: {
                user: {
                    connect: {
                        id: user.id
                    }
                },
                stall: {
                    connect: {
                        id: stall.id
                    }
                },
                foods: {
                    create: items.map((item) => ({
                        food: { connect: { id: item.food.id } },
                        count: item.count
                    }))
                },
            },
            include: ORDER_INCLUDE
        });

        res.status(201)
            .json(singletonJson(order));
    }

    async function update(req: Request, res: Response) {
        const user: User = req.body.user;
        const orderId: number = parseInt(`${req.params.id}`);
        const items: FoodsOnOrders[] | undefined = req.body.items;
        const newItems: { food: Food, count?: number }[] = req.body.newItems ?? [];
        
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                ...ORDER_INCLUDE,
                stall: {
                    include: { menu: true }
                }
            }
        });

        if (!items) {
            res.status(400)
                .json(errorJson(400, {
                    items: "Required",
                    newItems: "Optional"
                }));
            return;
        }

        if (!order) {
            res.status(404)
                .json(errorJson(404, "Order not found"));
            return;
        }
        
        if (user.role !== Role.ADMIN && order.userId !== user.id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (order.paid) {
            res.status(400)
                .json(errorJson(400, "Cannot update paid order"));
            return;
        }

        if (newItems.some((item) => item.food.menuId !== order.stall.menu?.id)) {
            res.status(400)
                .json(errorJson(400, "New items do not belong to the same menu"));
            return;
        }

        const editedItems: FoodsOnOrders[] =
            items.filter(item => order.foods.some(
                x => x.foodId === item.foodId &&
                    x.orderId === item.orderId &&
                    x.count !== item.count)
            )

        const deletedItems: FoodsOnOrders[] = order.foods
            .filter(item => items
                .every(input =>
                    item.foodId !== input.foodId ||
                    item.orderId !== input.orderId
                )
            )
            .map(item => ({
                // Prisma disconnect does not work with composite keys
                count: item.count,
                foodId: item.foodId,
                orderId: item.orderId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }));

        const newItemsToConnect: { food: Food, count?: number }[] =
            uniqBy(
                newItems.filter(item => "id" in item.food)
                    .map(item => item as { food: Food, count?: number }),
                (item) => item.food.id
            )
            .filter(item => order.foods.every(x => x.foodId !== item.food.id));
        
        prisma.order.update(
            {
                where: { id: orderId },
                data: {
                    foods: {
                        update: editedItems.map(item => ({
                            where: {
                                foodId_orderId: {
                                    foodId: item.foodId,
                                    orderId: item.orderId
                                }
                            },
                            data: { count: item.count }
                        })),
                        deleteMany: deletedItems,
                        create: newItemsToConnect.map(item => ({
                            food: { connect: { id: item.food.id } },
                            count: item.count
                        })),
                    }
                },
                include: ORDER_INCLUDE
            }
        )
            .then(order => res.status(200)
                .json(singletonJson(order, "Order successfully updated"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function destroy(req: Request, res: Response) {
        const user: User = req.body.user;
        const orderId: number = parseInt(`${req.params.id}`);

        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: ORDER_INCLUDE
        });

        if (!order) {
            res.status(404)
                .json(errorJson(404, "Order not found"));
            return;
        }

        if (user.role !== Role.ADMIN && order.userId !== user.id) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (order.paid) {
            res.status(400)
                .json(errorJson(400, "Cannot delete paid order"));
            return;
        }

        prisma.order.delete({
            where: { id: order.id }
        })
            .then(() => res.status(200)
                .json(singletonJson(order, "Order successfully deleted"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function fulfillOrder(req: Request, res: Response) {
        const orderId: number = parseInt(`${req.params.id}`);
        const user: User = req.body.user;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                ...ORDER_INCLUDE,
                stall: true
            }
        });

        if (!order) {
            res.status(404)
                .json(errorJson(404, "Order not found"));
            return;
        }

        if (user.role !== Role.ADMIN && user.id !== order.stall.ownerId) {
            res.status(403)
                .json(errorJson(403, "Unauthorized"));
            return;
        }

        if (order.fulfilled) {
            res.status(400)
                .json(errorJson(400, "Order already fulfilled"));
            return;
        }

        prisma.order.update({
            where: { id: orderId },
            data: { fulfilled: true },
            include: ORDER_INCLUDE
        })
            .then(order => res.status(200)
                .json(singletonJson(order, "Order fulfilled"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    return {
        index,
        read,
        create,
        update,
        destroy,
        fulfillOrder
    };
}

export const {
    index,
    read,
    create,
    update,
    destroy,
    fulfillOrder
} = ordersControllerFactory(client);