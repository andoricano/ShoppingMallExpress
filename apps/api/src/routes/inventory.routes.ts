import { Router } from 'express';
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
} from '../controllers/inventory.controller.js';

const router: Router = Router();

router.get('/', getInventoryItems);
router.post('/', createInventoryItem);
router.patch('/:uuid', updateInventoryItem);
router.delete('/:uuid', deleteInventoryItem);

export default router;