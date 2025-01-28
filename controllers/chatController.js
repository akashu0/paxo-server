const Conversation = require('../models/conversation');
const { predefinedResponses } = require('../utils/responses');

class ChatController {
  constructor(io) {
    this.io = io;
    // this.getConversations = this.getConversations.bind(this);
    this.getConversations = this.getConversations.bind(this);
    this.getConversation = this.getConversation.bind(this);
    this.getUserConversations = this.getUserConversations.bind(this);
    this.getAllConversations = this.getAllConversations.bind(this);
    this.updateConversation = this.updateConversation.bind(this);
    this.handleCustomerMessage = this.handleCustomerMessage.bind(this);
    this.handleAdminReply = this.handleAdminReply.bind(this);
  }



  async getConversations(req, res) {
    try {
      const query = { 
        anonymousId: req.fingerprint.hash,
        status: { $ne: 'closed' } 
      };

 
      
      
      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .limit(1);
        
      res.json(conversations);
    } catch (error) {
      console.error('Error in getConversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Public route - Get conversations for anonymous/authenticated users
  async getConversation(req, res) {
    try {
      const query = req.user ? 
        { userId: req.user.id } : 
        { anonymousId: req.fingerprint.hash };
        
      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .limit(50);
        
      res.json(conversations);
    } catch (error) {
      console.error('Error in getConversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Public route - Get specific conversation
  async getUserConversations(req, res) {
    try {
      const conversations = await Conversation.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .limit(50);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }


  // Authenticated user route - Get user's conversations
  async getUserConversations(req, res) {
    try {
      const conversations = await Conversation.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .limit(50);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Admin route - Get all conversations
  async getAllConversations(req, res) {
    try {
      const conversations = await Conversation.find()
        .populate('userId', 'username email')
        .sort({ updatedAt: -1 });
      res.json(conversations);
    } catch (error) {
      console.error('Error in getAllConversations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Admin route - Update conversation
  async updateConversation(req, res) {
    try {
      const { status } = req.body;
      const conversation = await Conversation.findByIdAndUpdate(
        req.params.id,
        { status, updatedAt: new Date() },
        { new: true }
      );
      
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      this.io.to(`conversation_${conversation._id}`).emit('conversation_updated', {
        conversationId: conversation._id,
        status
      });

      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }



   async handleCustomerMessage(socket, data) {
    try {
      const userId = socket.user?.id;
      const anonymousId = socket.fingerprint?.hash;

      console.log(anonymousId,"anonymousId");
      

      let conversation = data.conversationId ? 
        await Conversation.findById(data.conversationId) : 
        new Conversation({
          userId,
          anonymousId,
          status: 'active'
        });

      const userMessage = { 
        text: data.text, 
        sender: 'user',
        timestamp: new Date()
      };
      
      conversation.messages.push(userMessage);
      conversation.updatedAt = new Date();
      await conversation.save();

      // Join the conversation room
      socket.join(`conversation_${conversation._id}`);

      this.io.to('admin_room').emit('new_customer_message', {
        conversationId: conversation._id,
        message: userMessage,
        userId,
        anonymousId
      });
    } catch (error) {
      console.error('Error in handleCustomerMessage:', error);
      socket.emit('error', { message: 'Error processing message' });
    }
  }

  async handleAdminReply(socket, data) {
    try {
      const conversation = await Conversation.findById(data.conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const adminMessage = {
        text: data.text,
        sender: 'admin',
        timestamp: new Date()
      };

      conversation.messages.push(adminMessage);
      conversation.updatedAt = new Date();
      await conversation.save();

      this.io.to(`conversation_${conversation._id}`).emit('message_received', adminMessage);
      this.io.to('admin_room').emit('message_sent', {
        conversationId: data.conversationId,
        message: adminMessage
      });
    } catch (error) {
      console.error('Error in handleAdminReply:', error);
      socket.emit('error', { message: 'Error sending reply' });
    }
  }


  getAutomatedResponse(message) {
    const lowercaseMessage = message.toLowerCase();
    for (const [keyword, response] of Object.entries(predefinedResponses)) {
      if (lowercaseMessage.includes(keyword)) return response;
    }
    return predefinedResponses.default;
  }
}

module.exports = ChatController;