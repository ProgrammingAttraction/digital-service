const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://mplusecomputer_db_user:wl0V3aimYbbDhflD@cluster0.0yrt5xs.mongodb.net/?appName=Cluster0");

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;