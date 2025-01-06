const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const authRoutes = require("./routes/auth")



app.use(cors({
    origin: '*', // allow any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}));

app.use('/uploads', express.static('uploads'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));


// Mongoose connect with error handling
const connectDb = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Error connecting to database:", error.message);
      process.exit(1); // Exit the application if unable to connect to MongoDB
    }
  };

  connectDb();



  
app.get("/", (req, res) => {
    res.send("PAXOWEALTH BACKEND")
})

  app.listen(process.env.PORT, () => {
    console.log(`Express server is running on port ${process.env.PORT} `);
  });