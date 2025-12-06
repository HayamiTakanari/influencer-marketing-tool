import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createContract,
  getContract,
  signContract,
  rejectContract,
  getMyContracts,
} from '../controllers/contract.controller';

const router = Router();

// Chapter 5: Contract routes
router.post('/', authenticate, createContract);
router.get('/project/:projectId', authenticate, getContract);
router.post('/:contractId/sign', authenticate, signContract);
router.post('/:contractId/reject', authenticate, rejectContract);
router.get('/my/list', authenticate, getMyContracts);

export default router;
