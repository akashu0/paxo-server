const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { userVerify,setupMiddleware} = require("../middlewares/user");
const { adminVerify, checkPermission } = require("../middlewares/admin");

module.exports = (io) => {
  const chatController = new ChatController(io);

  // Apply fingerprint middleware to public routes
  router.get('/conversations', setupMiddleware, chatController.getConversations);
  router.get('/get-conversations', setupMiddleware, chatController.getConversation);

  // User authenticated routes
  router.get('/user/conversations', userVerify, chatController.getUserConversations);
  
  // Admin routes with permission checks
  router.get('/admin/conversations', [adminVerify, checkPermission('chat', 'view')], chatController.getAllConversations);
  router.put('/admin/conversations/:id', [adminVerify, checkPermission('chat', 'edit')], chatController.updateConversation);

  return router;
};