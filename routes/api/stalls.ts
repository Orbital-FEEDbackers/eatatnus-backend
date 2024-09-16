import express from "express";
import { index, create, read, update, destroy, createReview, assignOwner } from "../../controllers/api/stallsController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = express.Router();

router.post("/:id/review", authenticate, createReview);
router.post("/:id/owner", authenticate, assignOwner);

router.get('/:id', read);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, destroy);

router.get('/', index);
router.post('/', authenticate, create);

export default router;