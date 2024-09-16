import { Request, Response } from "express";
import { singletonJson, errorJson } from "../../utils/json/index.js";
import stripe from "../../stripe/client.js";
import { Role, User } from "@prisma/client";
import client from "../../prisma/client.js";
import Stripe from "stripe";

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? "";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export function paymentsControllerFactory(prisma: typeof client) {

    async function getPublishableKey(req: Request, res: Response) {
        const stallId = req.query.stallId ? parseInt(req.query.stallId.toString()) : null;

        if (stallId === null) {
            res.status(200).json(
                singletonJson({ publishableKey: STRIPE_PUBLISHABLE_KEY })
            );
            return;
        }

        if (Number.isNaN(stallId)) {
            res.status(400)
                .json(errorJson(400, "Invalid stallId"));
            return;
        }

        const stall = await prisma.stall.findUnique({
            where: {
                id: stallId
            },
            include: {
                owner: true
            }
        });

        if (!stall?.owner) {
            res.status(404)
                .json(errorJson(404, "Stall owner not found"));
            return;
        }

        if (!stall.owner.stripeAccountId) {
            res.status(404)
                .json(errorJson(404, "Stall owner has not connected a Stripe account"));
            return;
        }

        const stripeAccountId = stall.owner.stripeAccountId;

        res.status(200).json(
            singletonJson({ publishableKey: STRIPE_PUBLISHABLE_KEY, stripeAccountId: stripeAccountId })
        );
    }

    async function getAccountLink(req: Request, res: Response) {
        const user: User = req.body.user;

        const stripeAccountId = user.stripeAccountId;

        if (user.role !== Role.BUSINESS) {
            res.status(403)
                .json(errorJson(403, "Unauthorized. Only business owners can create account links"));
            return;
        }

        if (stripeAccountId === null) {
            res.status(400)
                .json(errorJson(400, "User has not connected a Stripe account"));
            return;
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}/api/payments/stripe-refresh/?stripeAccountId=${stripeAccountId}`,
            return_url: `${baseUrl}/api/payments/stripe-return/`,
            type: 'account_onboarding',
        })
            .then((accountLink) => res.status(200).json(
                singletonJson(accountLink, "This is the account link for Stripe")
            ))
            .catch((error) => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function isUserOnboarded(req: Request, res: Response) {
        const userId = parseInt(`${req.body.userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user === null) {
            res.status(404)
                .json(errorJson(404, "User not found"));
            return;
        }

        if (user.role !== Role.BUSINESS) {
            res.status(400)
                .json(errorJson(400, "User is not a business owner"));
            return;
        }

        const stripeAccountId = user.stripeAccountId;

        if (stripeAccountId === null) {
            res.status(200).json(
                singletonJson(false, "User has not connected a Stripe account")
            );
            return;
        }

        stripe.accounts.retrieve(stripeAccountId)
            .then((account) => {
                const isUserOnboarded = account.charges_enabled;
                res.status(200).json(
                    singletonJson(isUserOnboarded, isUserOnboarded
                        ? "User has completed onboarding"
                        : "User has not completed onboarding"
                    )
                );
            })
            .catch((error) => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function createPaymentSheet(req: Request, res: Response) {
        const orderId: number = parseInt(`${req.body.orderId}`);

        if (!orderId) {
            res.status(400)
                .json(errorJson(400, {
                    orderId: "Required"
                }));
            return
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                foods: {
                    include: {
                        food: true
                    }
                }
            }
        });

        if (order === null) {
            res.status(404)
                .json(errorJson(404, "Order not found"));
            return;
        }

        if (order.paid) {
            res.status(404)
                .json(errorJson(404, "Order has already been paid"));
            return;
        }

        const stall = await prisma.stall.findUnique({
            where: {
                id: order.stallId
            },
            include: {
                owner: true
            }
        });

        if (!stall?.owner) {
            res.status(404)
                .json(errorJson(404, "Stall owner not found"));
            return;
        }

        if (!stall.owner.stripeAccountId) {
            res.status(404)
                .json(errorJson(404, "Stall owner has not connected a Stripe account"));
            return;
        }

        const stripeAccountId = stall.owner.stripeAccountId;

        const totalAmount = order.foods.reduce(
            (acc, item) => acc + (item.count * (item.food.price ?? 0)),
            0
        );

        stripe.paymentIntents.create({
            amount: Math.max(50, Math.round(totalAmount * 100)), // in cents (integer); minimum amount is $0.50
            currency: 'sgd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                orderId: orderId
            }
        }, {
            stripeAccount: stripeAccountId
        })
            .then((paymentIntent) =>
                res.status(200).json({
                    paymentIntent: paymentIntent.client_secret,
                    stripeAccountId: stripeAccountId,
                    publishableKey: STRIPE_PUBLISHABLE_KEY
                })
            )
            .catch((error) => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function stripeReturn(req: Request, res: Response) {
        res.send("You have completed onboarding with Stripe. You may now close this window and return to eat@NUS.");
    }

    async function stripeRefresh(req: Request, res: Response) {
        const stripeAccountId = req.query.stripeAccountId?.toString() ?? "";

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}/api/payments/stripe-refresh/?stripeAccountId=${stripeAccountId}`,
            return_url: `${baseUrl}/api/payments/stripe-return/`,
            type: 'account_onboarding',
        })
            .then((accountLink) => res.redirect(accountLink.url))
            .catch((error) => res.status(500)
                .json(errorJson(500, error.message))
            );
    }

    async function webhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'] ?? "";

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : err}`);
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                // Then define and call a function to handle the event payment_intent.succeeded
                const succeededAt = new Date(event.created * 1000); // convert to milliseconds
                await handlePaymentIntentSucceeded(paymentIntentSucceeded, succeededAt);
                break;
            case 'account.updated':
                const accountUpdated = event.data.object;
                // Then define and call a function to handle the event account.updated
                break;
            // ... handle other event types
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.send();
    }

    async function handlePaymentIntentSucceeded(
        paymentIntentSucceeded: Stripe.PaymentIntent,
        succeededAt: Date
    ) {
        const orderId = parseInt(paymentIntentSucceeded.metadata.orderId);

        if (Number.isNaN(orderId)) {
            return;
        }

        await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                paid: true,
                paidAt: succeededAt
            }
        })
            .catch((error: Error) =>
                console.log("An error has occurred while updating the order: ", error.message)
            );

        return;
    }

    return {
        getPublishableKey,
        getAccountLink,
        isUserOnboarded,
        createPaymentSheet,
        stripeReturn,
        stripeRefresh,
        webhook
    };
}

export const {
    getPublishableKey,
    getAccountLink,
    isUserOnboarded,
    createPaymentSheet,
    stripeReturn,
    stripeRefresh,
    webhook
} = paymentsControllerFactory(client);