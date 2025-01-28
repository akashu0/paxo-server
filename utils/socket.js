const ChatController = require('../controllers/chatController');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const User = require('../models/userModel');

// const setupSocket = (io) => {
//   const chatController = new ChatController(io);

//   io.use(async (socket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
//       const fingerprint = socket.handshake.query.fingerprint;

//       if (token) {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id) || await Admin.findById(decoded.id);
//         if (user) {
//           socket.user = user;
//         }
//       }
      
//       socket.fingerprint = { hash: fingerprint };
//       next();
//     } catch (err) {
//       socket.fingerprint = { hash: socket.handshake.query.fingerprint };
//       next();
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log('Client connected:', socket.id);

//     socket.on('customer_message', (data) => {
//       chatController.handleCustomerMessage(socket, data);
//     });

//     socket.on('admin_reply', (data) => {
//       chatController.handleAdminReply(socket, data);
//     });

//     socket.on('join_conversation', (conversationId) => {
//       socket.join(`conversation_${conversationId}`);
//     });

//     socket.on('join_admin', async () => {
//       if (socket.user?.role === 'admin') {
//         socket.join('admin_room');
//       }
//     });

//     socket.on('disconnect', () => {
//       console.log('Client disconnected:', socket.id);
//     });
//   });
// };


const setupSocket = (io) => {
  const chatController = new ChatController(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const fingerprint = socket.handshake.query.fingerprint;

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id) || await Admin.findById(decoded.id);
        if (user) {
          socket.user = user;
        }
      }
      
      socket.fingerprint = { hash: fingerprint };
      next();
    } catch (err) {
      socket.fingerprint = { hash: socket.handshake.query.fingerprint };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('customer_message', async (data) => {
      await chatController.handleCustomerMessage(socket, data);
    });

    socket.on('admin_reply', async (data) => {
      await chatController.handleAdminReply(socket, data);
    });

    socket.on('join_conversation', (conversationId) => {
      console.log(`Client ${socket.id} joining conversation ${conversationId}`);
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('join_admin', async () => {
      if (socket.user?.role === 'admin') {
        console.log(`Admin ${socket.id} joining admin room`);
        socket.join('admin_room');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSocket;

// module.exports = setupSocket;