import express from "express";
import {
    index, 
    read,
    create,
    update,
    destroy,
    createProfile,
    updateProfile,
    updateNotification,
    destroyNotifications
} from "../../controllers/api/usersController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = express.Router();

router.patch("/notifications", authenticate, updateNotification);
router.delete("/notifications", authenticate, destroyNotifications);

router.post("/:id/profile", authenticate, createProfile);
router.patch("/:id/profile", authenticate, updateProfile);

router.get("/:id", read);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, destroy);

router.get("/", authenticate, index);
router.post("/", create)

export default router;