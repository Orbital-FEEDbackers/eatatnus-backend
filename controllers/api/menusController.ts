import { Request, Response } from "express";
import { isEqual } from "lodash-es"
import client from "../../prisma/client.js";
import { Food, User, Role } from "@prisma/client";
import transformMenuItemsWithNutritionalInfo from "../../utils/transformMenuItemsWithNutritionalInfo.js";
import { singletonJson, errorJson } from "../../utils/json/index.js";

export const MENU_INCLUDE = {
    items: true,
    stall: true
};

export function menusControllerFactory(prisma: typeof client) {
    async function read(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);

        const menu = await prisma.menu.findUnique(
            {
                where: { id: id },
                include: MENU_INCLUDE
            }
        );

        if (menu === null) {
            res.status(404).json(errorJson(404, "Menu not found"));
            return;
        }

        res.status(200).json(singletonJson(menu));
    }

    async function create(req: Request, res: Response): Promise<void> {
        const stallId = parseInt(req.body.stallId);
        const items: (Food | Omit<Food, "id">)[] | undefined = req.body.items;
        const user: User = req.body.user;

        if (user.role !== Role.BUSINESS && user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403, "Unauthorized. Only business owners and admins can create menus"));
            return;
        }

        if (Number.isNaN(stallId) || items == undefined) {
            res.status(400).json(errorJson(400, {
                items: "Required",
                stallId: "Required",
            }));
            return;
        }

        const itemsWithNutritionalInfo: Omit<Food, "id">[] =
            await transformMenuItemsWithNutritionalInfo(items);

        prisma.menu.create(
            {
                data: {
                    stallId: stallId,
                    items: {
                        create: itemsWithNutritionalInfo
                    }
                },
                include: MENU_INCLUDE
            }
        )
            .then(menu => res.status(201)
                .json(singletonJson(menu, "Menu created succesfully"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function update(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const items: Omit<Food, "id">[] | undefined = req.body.items;
        const user: User = req.body.user;

        if (!items) {
            res.status(400)
                .json(errorJson(400, { items: "Required" }));
            return;
        }

        const menu = await prisma.menu.findUnique(
            {
                where: { id: id },
                include: MENU_INCLUDE
            }
        );

        if (menu?.stall.ownerId !== user.id && user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403,
                    "Unauthorized. Only business owners and admins can create menus"));
            return;
        }

        if (menu === null) {
            res.status(404).json(errorJson(404, "Menu not found"));
            return;
        }

        const updatedItems: Food[] = items.filter(item => "id" in item)
            .map(item => item as Food)
            .filter(item => menu.items.some(
                menuItem => item.id === menuItem.id && !isEqual(menuItem, item))
            );

        const deletedItems: Food[] = menu.items
            .filter(item => items
                .filter(item => "id" in item)
                .map(item => item as Food)
                .every(input => item.id !== input.id)
            );

        const newItems: Omit<Food, "id">[] = items.filter(item => !("id" in item));

        const newItemsWithNutritionalInfo: Omit<Food, "id">[] =
            await transformMenuItemsWithNutritionalInfo(newItems);

        await Promise.all(updatedItems.map(
            item => prisma.food.update(
                {
                    where: { id: item.id },
                    data: item
                }
            )
        ));

        prisma.menu.update(
            {
                where: { id: id },
                data: {
                    items: {
                        disconnect: deletedItems,
                        create: newItemsWithNutritionalInfo
                    }
                },
                include: MENU_INCLUDE
            }
        )
            .then(menu => res.status(200)
                .json(singletonJson(menu, "Menu successfully updated"))
            )
            .catch(error => res.status(500)
                .json(errorJson(500, error))
            );
    }

    async function destroy(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id);
        const user = req.body.user;

        const menu = await prisma.menu.findUnique(
            {
                where: { id: id },
                include: MENU_INCLUDE
            }
        );

        if (menu === null) {
            res.status(404).json(errorJson(404, "Menu not found"));
            return;
        }

        if (menu?.stall.ownerId !== user.id && user.role !== Role.ADMIN) {
            res.status(403)
                .json(errorJson(403, "Unauthorized. Only business owners and admins can delete menus"));
            return;
        }
        
        try {
            await prisma.menu.delete({ where: { id: id } });
        } catch (error) {
            res.status(500)
                .json(errorJson(500, error instanceof Error ? error.message : error));
            return;
        }

        res.status(200)
            .json(singletonJson(null, "Menu successfully deleted"));
    }

    return {
        read,
        create,
        update,
        destroy
    };
}

export const {
    read,
    create,
    update,
    destroy
} = menusControllerFactory(client);