// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    "https://uni-connect-nk7clgrj-gaurav23463s-projects.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

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
const userPairs = new Map(); // ✅ Track who is connected to whom

io.on("connection", (socket) => {
  console.log("🔗 User connected:", socket.id);

  // ✅ FIND PARTNER
  socket.on("find-partner", () => {
    if (waitingUser && waitingUser !== socket.id) {
      const partnerId = waitingUser;
      waitingUser = null;

      userPairs.set(socket.id, partnerId);
      userPairs.set(partnerId, socket.id);

      socket.emit("partner-found", partnerId);
      io.to(partnerId).emit("partner-found", socket.id);

      console.log("✅ Paired:", socket.id, "↔", partnerId);
    } else {
      waitingUser = socket.id;
      socket.emit("waiting");
    }
  });

  // ✅ RELAY WEBRTC SIGNALS SAFELY
  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  // ✅ PRIVATE CHAT (FIXED)
  socket.on("chatMessage", ({ to, text }) => {
    if (to) {
      io.to(to).emit("chatMessage", { text });
    }
  });

  // ✅ NEXT PARTNER
  socket.on("next-partner", () => {
    const partnerId = userPairs.get(socket.id);

    if (partnerId) {
      io.to(partnerId).emit("partner-left");
      userPairs.delete(partnerId);
    }

    userPairs.delete(socket.id);
    waitingUser = socket.id;

    socket.emit("waiting");
  });

  // ✅ END CHAT
  socket.on("end-chat", () => {
    const partnerId = userPairs.get(socket.id);

    if (partnerId) {
      io.to(partnerId).emit("partner-left");
      userPairs.delete(partnerId);
    }

    userPairs.delete(socket.id);
  });

  // ✅ DISCONNECT CLEANUP (FIXED)
  socket.on("disconnect", () => {
    if (waitingUser === socket.id) waitingUser = null;

    const partnerId = userPairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("partner-left");
      userPairs.delete(partnerId);
    }

    userPairs.delete(socket.id);
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

