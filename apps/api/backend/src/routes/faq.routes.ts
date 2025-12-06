import { Router } from 'express';
import { getFAQs } from '../controllers/faq.controller';

const router = Router();

router.get('/', getFAQs);

export default router;
