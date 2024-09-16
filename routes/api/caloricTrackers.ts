import express from "express";
import { index, create, destroy, createEntry, updateEntry, destroyEntry, search } from "../../controllers/api/caloricTrackersController.js";
import authenticate from "../../middlewares/authenticate.js";

const router = express.Router();

router.get('/search', search);

router.post('/entry', authenticate, createEntry);
router.patch('/entry', authenticate, updateEntry);
router.delete('/entry', authenticate, destroyEntry);

router.get('/', authenticate, index);
router.post('/', authenticate, create);
router.delete('/', authenticate, destroy);

export default router;