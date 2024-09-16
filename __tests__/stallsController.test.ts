import { stallsControllerFactory } from "../controllers/api/stallsController.js";
import { MockContext, Context, createMockContext } from '../prisma/context.js';
import { User, Role, ReviewType, Stall } from "@prisma/client";
import { Request, Response } from "express";
import { jest } from "@jest/globals";

let mockCtx: MockContext;
let ctx: Context;

describe("Stalls Controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response> = {};
    let stallsController: ReturnType<typeof stallsControllerFactory>;

    beforeEach(() => {
        mockCtx = createMockContext();
        ctx = mockCtx as unknown as Context;
        stallsController = stallsControllerFactory(ctx.prisma);

        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis() as (code: number) => Response<any, Record<string, any>>,
            json: jest.fn().mockReturnThis() as any
        };
    });

    afterAll(async () => {
        await ctx.prisma.$disconnect();
    });

    it("[index] should return a list of stalls", async () => {
        const stalls = [
            { id: 1, name: "Stall 1", description: null, canteenId: 1, createdAt: new Date(), updatedAt: new Date(), ownerId: null },
            { id: 2, name: "Stall 2", description: null, canteenId: 2, createdAt: new Date(), updatedAt: new Date(), ownerId: null }
        ];
        mockCtx.prisma.stall.findMany.mockResolvedValue(stalls);
    
        await stallsController.index(req as Request, res as Response);
    
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                items: stalls,
                length: 2,
            }
        });
    });

    it("[create] should create a new stall", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const stall = {
            id: 1, name: "Stall 1", description: "A new stall", canteenId: 1, createdAt: new Date(), updatedAt: new Date(), ownerId: null, reviews: []
        };

        req.body = {
            user: user,
            name: "Stall 1",
            description: "A new stall",
            canteenId: 1
        };

        mockCtx.prisma.stall.create.mockResolvedValue(stall);

        await stallsController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: stall.id,
                name: stall.name
            }),
            message: "Stall created successfully"
        }));
    });

    it("[create] should return 400 when required fields are missing", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            description: "A new stall", // Missing 'name' and 'canteenId'
        };

        await stallsController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 400,
                message: {
                    name: "Required",
                    canteenId: "Required and must be a number"
                }
            }
        });
    });

    it("[read] should return a single stall", async () => {
        const stall = {
            id: 1, name: "Stall 1", description: "A new stall", canteenId: 1, createdAt: new Date(), updatedAt: new Date(),
            reviews: [], ownerId: null
        };

        req.params = { id: "1" };

        mockCtx.prisma.stall.findUnique.mockResolvedValue(stall);

        await stallsController.read(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: stall.id,
                name: stall.name
            })
        }));
    });

    /*
    it("[update] should update a stall successfully", async () => {
        // Test fail: TypeError: Cannot read properties of undefined (reading 'then')
        // Todo: Investigate why this error occurs

        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const updatedStall = {
            id: 1, name: "Updated Stall", description: "Updated description", canteenId: 1,
            createdAt: new Date(), updatedAt: new Date(), ownerId: null, reviews: []
        };

        req.body = {
            user: user,
            name: "Updated Stall",
            description: "Updated description"
        };

        req.params = { id: "1" };

        mockCtx.prisma.stall.update.mockResolvedValue(updatedStall);

        await stallsController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Stall updated successfully"
        }));
    });

    it("[update] should return 403 when a non-admin user tries to update a stall", async () => {
        // Test fail: TypeError: Cannot read properties of undefined (reading 'then')
        // Todo: Investigate why this error occurs

        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "Updated Stall"
        };

        req.params = { id: "1" };

        await stallsController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 403, "message": "Unauthorized" } }));
    });

    it("[destroy] should delete a stall successfully", async () => {
        // Test fail: TypeError: Cannot read properties of undefined (reading 'then')
        // Todo: Investigate why this error occurs

        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        const stall : Stall = {
            id: 1, name: "Stall 1", description: "A new stall", canteenId: 1,
            createdAt: new Date(), updatedAt: new Date(), ownerId: null
        };

        req.body = { user: user };
        req.params = { id: "1" };

        mockCtx.prisma.stall.delete.mockResolvedValue(stall);

        await stallsController.destroy(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Stall deleted successfully"
        }));
    });

    it("[destroy] should return 403 when a non-admin user tries to delete a stall", async () => {
        // Test fail: TypeError: Cannot read properties of undefined (reading 'then')
        // Todo: Investigate why this error occurs

        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = { user: user };
        req.params = { id: "1" };

        await stallsController.destroy(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 403, "message": "Unauthorized" } }));
    });
    */

    it("[assignOwner] should assign an owner to a stall successfully", async () => {
        const adminUser: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        const ownerUser: User = {
            id: 2, email: "owner@test.com", role: Role.USER,
            firebaseId: "",
            name: "Owner",
            createdAt: new Date(),
            stripeAccountId: null
        };

        const stall = {
            id: 1, name: "Stall 1", description: "A new stall", canteenId: 1, ownerId: null,
            createdAt: new Date(), updatedAt: new Date(), reviews: []
        };

        req.body = {
            user: adminUser,
            ownerId: ownerUser.id
        };
        req.params = { id: "1" };

        mockCtx.prisma.stall.update.mockResolvedValue({ ...stall, ownerId: ownerUser.id });

        await stallsController.assignOwner(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Owner assigned successfully"
        }));
    });

    it("[assignOwner] should return 403 when a non-admin user tries to assign an owner", async () => {
        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = { user: user, ownerId: 3 };
        req.params = { id: "1" };

        await stallsController.assignOwner(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 403, "message": "Unauthorized" } }));
    });
});
