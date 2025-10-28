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

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5500",
      "https://uni-connect-tv-1.vercel.app",
      "https://uni-connect-tv-5.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  socket.on("find-partner", () => {
    if (waitingUser && waitingUser !== socket.id) {
      const partnerId = waitingUser;
      waitingUser = null;

      socket.emit("partner-found", partnerId);
      io.to(partnerId).emit("partner-found", socket.id);
    } else {
      waitingUser = socket.id;
      socket.emit("waiting");
    }
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", { from: socket.id, msg });
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket.id) waitingUser = null;
    socket.broadcast.emit("partner-left", socket.id);
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

