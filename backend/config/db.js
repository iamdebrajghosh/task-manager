// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI is not set in environment variables");
      console.error("Please create a .env file in the backend directory with:");
      console.error("MONGO_URI=mongodb://localhost:27017/mern-todo-app");
      console.error("Or for MongoDB Atlas:");
      console.error("MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname");
      process.exit(1);
    }
    console.log("🔄 Trying to connect to MongoDB...");
    console.log("📍 Connection string:", mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    
    await mongoose.connect(mongoUri, options);
    console.log("✅ MongoDB Connected Successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    if (error.message.includes('authentication failed')) {
      console.error("💡 Check your MongoDB username and password");
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error("💡 Check your MongoDB connection string and network connection");
    } else if (error.message.includes('timeout')) {
      console.error("💡 MongoDB server is not reachable. Check if MongoDB is running");
    }
    console.error("\n💡 Make sure:");
    console.error("   1. MongoDB is installed and running (for local)");
    console.error("   2. Your connection string is correct");
    console.error("   3. Your network allows connections to MongoDB");
    process.exit(1);
  }
};

module.exports = connectDB;
