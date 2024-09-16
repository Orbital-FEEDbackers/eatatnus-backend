import { canteensControllerFactory } from "../controllers/api/canteensController.js";
import { MockContext, Context, createMockContext } from '../prisma/context.js';
import { User, Role, ReviewType } from "@prisma/client";
import { Request, Response } from "express";
import { Send } from "express-serve-static-core";
import { jest } from "@jest/globals";

let mockCtx: MockContext;
let ctx: Context;

describe("Canteens Controller", () => {
    let req: Partial<Request>;
    let res: Partial<Response> = {};
    let canteensController: ReturnType<typeof canteensControllerFactory>;

    beforeEach(() => {
        mockCtx = createMockContext();
        ctx = mockCtx as unknown as Context;
        canteensController = canteensControllerFactory(ctx.prisma);

        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis() as (code: number) => Response<any, Record<string, any>>,
            json: jest.fn().mockReturnThis() as Send<any, Response<any, Record<string, any>>>
        };
    });

    afterAll(async () => {
        await ctx.prisma.$disconnect();
    });

    it("[index] should return a list of canteens", async () => {
        const canteens = [
            { id: 1, name: "Canteen 1", description: null, createdAt: new Date(), updatedAt: new Date(), locationId: null },
            { id: 2, name: "Canteen 2", description: null, createdAt: new Date(), updatedAt: new Date(), locationId: null }
        ];
        mockCtx.prisma.canteen.findMany.mockResolvedValue(canteens);

        await canteensController.index(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            data: {
                items: canteens,
                length: 2,
            }
        });
    });

    it("[create] should create a new canteen", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const canteen = {
            id: 1, name: "Canteen 1", description: "A new canteen", createdAt: new Date(), updatedAt: new Date(), locationId: 1
        };

        // Set up the request body
        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        // Mock the database calls
        mockCtx.prisma.location.findUnique.mockResolvedValue(null);
        mockCtx.prisma.canteen.create.mockResolvedValue(canteen);

        // Call the controller method
        await canteensController.create(req as Request, res as Response);

        // Check if res.status was called
        expect(res.status).toHaveBeenCalledWith(201);

        // Check if res.json was called with the correct data
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: canteen.id,
                name: canteen.name
            }),
            message: "Canteen created successfully"
        }));
    });

    it("[create] should not create a canteen if the user is not an admin", async () => {
        const user: User = {
            id: 1, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 403,
                message: "Unauthorized"
            }
        });
    });

    it("[create] should return 403 when a non-admin user tries to create a canteen", async () => {
        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            { error: { code: 403, message: "Unauthorized" } }
        );
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
            description: "A new canteen", // Missing 'name' and 'address'
        };

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 400,
                message: {
                    address: "Required",
                    name: "Required"
                }
            }
        });
    });

    it("[create] should create a canteen with an existing location", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const existingLocation = { id: 1, address: "123 Main St", latitude: 10, longitude: 20 };
        const canteen = {
            id: 1, name: "Canteen 1", description: "A new canteen", createdAt: new Date(), updatedAt: new Date(), locationId: existingLocation.id
        };

        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        mockCtx.prisma.location.findUnique.mockResolvedValue(existingLocation);
        mockCtx.prisma.canteen.create.mockResolvedValue(canteen);

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: canteen.id,
                name: canteen.name
            }),
            message: "Canteen created successfully"
        }));
    });

    it("[create] should return 500 if there is an error during canteen creation", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        mockCtx.prisma.location.findUnique.mockResolvedValue(null);
        mockCtx.prisma.canteen.create.mockRejectedValue(new Error("Database error"));

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: { code: 500, message: "Cannot create canteen \nDatabase error" }
        }));
    });

    it("[create] should create a canteen with a new location", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const newLocation = { id: 69, address: "123 Main St", latitude: 10, longitude: 20 };
        const canteen = {
            id: 1, name: "Canteen 1", description: "A new canteen", createdAt: new Date(), updatedAt: new Date(), locationId: 1
        };

        req.body = {
            user: user,
            name: "Canteen 1",
            description: "A new canteen",
            address: "123 Main St"
        };

        mockCtx.prisma.location.findUnique.mockResolvedValue(null);
        mockCtx.prisma.canteen.create.mockResolvedValue(canteen);
        mockCtx.prisma.location.create.mockResolvedValue(newLocation);

        await canteensController.create(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: canteen.id,
                name: canteen.name
            }),
            message: "Canteen created successfully"
        }));
    });

    it("[update] should return 403 when a non-admin user tries to update a canteen", async () => {
        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "Updated Canteen",
            address: "456 Main St"
        };

        req.params = { id: "1" };

        await canteensController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 403, "message": "Unauthorized" } }));
    });

    it("[update] should return 400 when required fields are missing in update", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "", // Missing 'name' and 'address'
            address: ""
        };

        req.params = { id: "1" };

        await canteensController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 400, "message": { "address": "Required", "name": "Required" } } }));
    });

    it("[update] should update a canteen successfully", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };
        const updatedCanteen = {
            id: 1, name: "Updated Canteen", description: "Updated description", createdAt: new Date(), updatedAt: new Date(), locationId: 1
        };

        req.body = {
            user: user,
            name: "Updated Canteen",
            description: "Updated description",
            address: "456 Main St"
        };

        req.params = { id: "1" };

        mockCtx.prisma.location.findUnique.mockResolvedValue(null);
        mockCtx.prisma.canteen.create.mockResolvedValue(updatedCanteen);

        await canteensController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Canteen updated successfully"
        }));
    });

    /*
    it("[update] should return 500 if there is an error during canteen update", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            name: "Updated Canteen",
            address: "456 Main St"
        };

        req.params = { id: "1" };

        mockCtx.prisma.canteen.update.mockRejectedValue(new Error("Database error"));

        await canteensController.update(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: "Database error"
        }));
    });
    */

    it("[delete] should return 403 when a non-admin user tries to delete a canteen", async () => {
        const user: User = {
            id: 2, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = { user: user };
        req.params = { id: "1" };

        await canteensController.destroy(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 403, "message": "Unauthorized" } }));
    });

    it("[delete] should delete a canteen successfully", async () => {
        const user: User = {
            id: 1, email: "admin@test.com", role: Role.ADMIN,
            firebaseId: "",
            name: "",
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = { user: user };
        req.params = { id: "1" };


        const canteen = {
            id: 1, name: "Updated Canteen", description: "Updated description", createdAt: new Date(), updatedAt: new Date(), locationId: 1
        };

        mockCtx.prisma.canteen.delete.mockResolvedValue(canteen);

        await canteensController.destroy(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Canteen deleted successfully"
        }));
    });

    it("[createReview] should return 400 when the rating field is missing in createReview", async () => {
        const user: User = {
            id: 1, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            description: "Great canteen!",
            imageFilenames: []
        };

        req.params = { id: "1" };

        await canteensController.createReview(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 400, "message": { "description": "Optional: string | null", "imageFilenames": "Optional: string[]", "rating": "Required: number" } } }
        ));
    });

    it("[createReview] should create a review successfully", async () => {
        const user: User = {
            id: 1, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        }; 

        const review = {
            id: 1, rating: 5, description: "Great canteen!", reviewType: ReviewType.OutletReview, canteenId: 1, stallId: null, userId: 1,
            createdAt: new Date(), updatedAt: new Date(), images: []
        };

        req.body = {
            user: user,
            rating: 5,
            description: "Great canteen!",
            imageFilenames: []
        };

        req.params = { id: "1" };

        mockCtx.prisma.review.create.mockResolvedValue(review);
        mockCtx.prisma.review.update.mockResolvedValue(review);

        await canteensController.createReview(req as Request, res as Response);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                id: review.id,
                rating: review.rating,
                description: review.description,
                images: review.images
            }),
            message: "Canteen review successfully created"
        }));
    });

    it("[createReview] should return 500 if there is an error during review creation", async () => {
        const user: User = {
            id: 1, email: "user@test.com", role: Role.USER,
            firebaseId: "",
            name: null,
            createdAt: new Date(),
            stripeAccountId: null
        };

        req.body = {
            user: user,
            rating: 5,
            description: "Great canteen!",
            imageFilenames: ["image1.jpg", "image2.jpg"]
        };

        req.params = { id: "1" };

        mockCtx.prisma.review.create.mockRejectedValue(new Error("Database error"));

        await canteensController.createReview(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ "error": { "code": 500, "message": "Database error" } }));
    });

});