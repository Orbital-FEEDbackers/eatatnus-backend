import express from "express";
import { index, read, create, destroy, update, fulfillOrder } from "../../controllers/api/ordersController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = express.Router();

router.patch('/:id/fulfill', authenticate, fulfillOrder);

router.get('/:id', authenticate, read);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, destroy);

router.get('/', authenticate, index);
router.post('/', authenticate, create);

export default router;