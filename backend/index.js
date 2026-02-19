require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4500;
const cors = require("cors");
const http = require('http'); // Add this
const socketIo = require('socket.io'); // Add this
const connectDB = require("./config/DB");
const Authrouter = require("./routes/Authrouter");
const Userroute = require("./routes/Userroute");
const Adminroute = require("./routes/Adminroute");
const Subadminroute = require("./routes/Subadminroute");

connectDB();

// Create HTTP server
const server = http.createServer(app); // Change from app.listen

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://admin.xbdapi24.icu",
      "https://subadmin.xbdapi24.icu",
      "https://xbdapi24.icu",
      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  }
});

// Store connected users
const connectedUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Join a room for this user
      socket.join(`user_${userId}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from connectedUsers map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });

  // Handle custom events
  socket.on('mark_as_read', (data) => {
    // Broadcast to other clients if needed
    io.emit('notification_read', data);
  });
});

// Make io accessible to routes
app.set('socketio', io);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://admin.xbdapi24.icu",
      "https://subadmin.xbdapi24.icu",
      "https://xbdapi24.icu",
      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "x-merchant-id",
      "x-timestamp",
      "x-nonce",
      "x-sign",
      "Access-Control-Allow-Origin",
      "userId",
      "User-Id",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/auth", Authrouter);
app.use("/api/user", Userroute);
app.use("/api/admin", Adminroute);
app.use("/api/sub-admin", Subadminroute);

// Socket.io route (optional)
app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});

app.get("/", (req, res) => {
  res.send("server is running with Socket.io");
});

// Start server
server.listen(port, () => {
  console.log(`Server is running on port ${port} with Socket.io`);
});

// Export for use in other files
module.exports = { io, connectedUsers };