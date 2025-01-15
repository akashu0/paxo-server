const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const authRoutes = require("./routes/auth")
const propertyRoutes = require("./routes/propertyRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const orderRoutes = require("./routes/orderRoutes")
const portfolioRoutes = require("./routes/portfolio");
const adminRoutes = require("./routes/admin");
const roleRoutes = require("./routes/role");
const legalRoutes = require("./routes/legalDocumentRoutes");

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
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/property", propertyRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/legal", legalRoutes);



app.listen(process.env.PORT, () => {
    console.log(`Express server is running on port ${process.env.PORT} `);
  });