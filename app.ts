import express, { Express, Request, Response } from "express";
import admin from "firebase-admin";
import dotenv from "dotenv";
import canteenRoutes from "./routes/api/canteens.js";
import stallRoutes from "./routes/api/stalls.js";
import reviewRoutes from "./routes/api/reviews.js";
import menuRoutes from "./routes/api/menus.js";
import caloricTrackerRoutes from "./routes/api/caloricTrackers.js";
import userRoutes from "./routes/api/users.js";
import paymentRoutes from "./routes/api/payments.js";
import orderRoutes from "./routes/api/orders.js";
import { createRequire } from "module";

dotenv.config();

const serviceAccount = createRequire(import.meta.url)(process.env.GOOGLE_APPLICATION_CREDENTIALS || "")
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const app: Express = express();
const port = process.env.PORT || 3000;

// For Stripe webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to eat@NUS backend server!");
});

app.use("/api/canteens", canteenRoutes);
app.use("/api/stalls", stallRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/caloric-tracker", caloricTrackerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});