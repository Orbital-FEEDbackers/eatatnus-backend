import { Router } from "express";
import { read, update, destroy, createReply, updateReply, deleteReply } from "../../controllers/api/reviewsController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = Router();

router.patch("/reply", authenticate, updateReply);
router.delete("/reply", authenticate, deleteReply);

router.post("/:id/reply", authenticate, createReply);

router.get("/:id", read);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, destroy);

export default router;