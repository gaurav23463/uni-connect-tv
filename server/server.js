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

// --- CORS: whitelist frontends (add your domains here) ---
const ALLOWED_ORIGINS = [
  "https://uni-connect-nk7clgrj-gaurav23463s-projects.vercel.app",
  "https://uni-connect-nk7clgrj-gaurav23463s-projects-git-main-yourusername.vercel.app", // optional variants if used
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  maxAge: 86400 // cache preflight for 1 day
};

// apply CORS to all routes
app.use(cors(corsOptions));

// ensure OPTIONS preflight returns correct headers even if route not hit
app.options("*", cors(corsOptions));

// body parser
app.use(express.json());

// api routes
app.use("/api", authRoutes);
app.use("/api", chatRoutes);

// create HTTP server + Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
});

// mount video socket handler (clean separation)
videoSocketHandler(io);

// health route
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

