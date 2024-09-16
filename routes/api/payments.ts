import { Router } from "express";
import { getPublishableKey, getAccountLink, createPaymentSheet, webhook, isUserOnboarded, stripeReturn, stripeRefresh } from "../../controllers/api/paymentsController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = Router();

router.get("/publishable-key", getPublishableKey);
router.get("/account-link", authenticate, getAccountLink);
router.post("/payment-sheet", authenticate, createPaymentSheet);
router.post("/webhook", webhook);
router.post("/onboarded", isUserOnboarded);
router.get("/stripe-return", stripeReturn);
router.get("/stripe-refresh", stripeRefresh);

export default router;