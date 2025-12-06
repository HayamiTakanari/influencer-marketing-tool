import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadCount,
  getChatList,
} from '../controllers/chat.controller';

const router = Router();

router.use(authenticate);

router.post('/messages', sendMessage);
router.get('/messages/:projectId', getMessages);
router.put('/messages/:projectId/read', markMessagesAsRead);
router.get('/unread-count', getUnreadCount);
router.get('/chats', getChatList);

export default router;