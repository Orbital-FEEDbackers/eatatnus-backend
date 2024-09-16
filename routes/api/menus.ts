import { Router } from "express";
import { read, create, update, destroy } from "../../controllers/api/menusController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = Router();

router.get("/:id", read);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, destroy);
router.post("/", authenticate, create);


export default router;