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

// ✅ Allow requests from both localhost and production
app.use(
  cors({
    origin: [
      "http://localhost:5500", // live server
      "http://localhost:3000", // react dev server
      "http://localhost:5000", // same origin (if served by express)
      "https://uni-connect-tv-1.vercel.app" // your deployed frontend
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public")); // serve frontend from backend (optional)
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
videoSocketHandler(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
