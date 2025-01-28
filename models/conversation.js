const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  sender: String, // 'user', 'bot', or 'admin'
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  anonymousId: { type: String, sparse: true },
  messages: [messageSchema],
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure either userId or anonymousId is present
conversationSchema.pre('save', function(next) {
  if (!this.userId && !this.anonymousId) {
    next(new Error('Either userId or anonymousId must be provided'));
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);