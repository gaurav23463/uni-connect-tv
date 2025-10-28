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

// ✅ Allow both local and deployed frontends
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://uni-connect-tv.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

// ✅ Create HTTP + Socket server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://uni-connect-tv-1.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// ✅ Initialize video socket handler
videoSocketHandler(io);

// ✅ Root endpoint for Render uptime
app.get("/", (req, res) => {
  res.send("✅ Uni Connect TV backend running successfully!");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});

});

