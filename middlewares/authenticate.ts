import admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { DecodedIdToken } from "firebase-admin/auth";
import type { User } from '@prisma/client'

const prisma = new PrismaClient();

async function findUser(decodedToken: DecodedIdToken): Promise<User | null> {
    return prisma.user.findFirst({ where: { firebaseId: decodedToken.uid } });
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
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

    admin.auth().verifyIdToken(idToken)
        .then(async decodedToken => {
            const user = await findUser(decodedToken);
            if (user === null) {
                throw new Error("User not found in server database");
            }
            req.body = {...req.body, user: user};
            next();
        })
        .catch(error => res.status(403).json({
            error: {
                code: 403,
                message: "Unauthorized\n" + error,
            },
        }));
}

export default authenticate;