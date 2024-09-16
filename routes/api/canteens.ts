import express from "express";
import { index, create, read, update, destroy, createReview } from "../../controllers/api/canteensController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = express.Router();

router.post("/:id/review", authenticate, createReview);

router.get('/:id', read);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, destroy);

router.get('/', index);
router.post('/', authenticate, create);

export default router;