// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { videoSocketHandler } from "./socket/videoSocket.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Proper CORS setup for both API & WebRTC
app.use(
  cors({
    origin: [
      "http://localhost:5500",        // local Live Server
      "http://localhost:3000",        // React dev server
      "http://localhost:5000",        // local backend
      "https://uni-connect-tv-1.vercel.app", // ✅ your deployed frontend
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public"));
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

// ✅ Create HTTP + Socket.io server
const httpServer = createServer(app);

// ✅ Correct socket.io CORS setup for signaling
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://uni-connect-tv.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // ensure socket fallback support
});

// ✅ Initialize video socket handling
videoSocketHandler(io);

// ✅ Keep server alive (Render auto-sleeps without this)
app.get("/", (req, res) => {
  res.send("🎥 Uni Connect TV Backend is Running Successfully!");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});

