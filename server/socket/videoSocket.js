// server/socket/videoSocket.js
// server/socket/videoSocket.js

export const videoSocketHandler = (io) => {
  let waitingUser = null;
  const pairs = new Map();

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // ✅ Find a random partner
    socket.on("find-partner", () => {
      if (!waitingUser) {
        waitingUser = socket;
        socket.emit("waiting");
        console.log("🕒 Waiting user:", socket.id);
      } else if (waitingUser.id !== socket.id) {
        const partner = waitingUser;
        waitingUser = null;

        // store pairing
        pairs.set(socket.id, partner.id);
        pairs.set(partner.id, socket.id);

        socket.emit("partner-found", partner.id);
        partner.emit("partner-found", socket.id);

        console.log(`🎉 Paired: ${socket.id} <--> ${partner.id}`);
      }
    });

    // ✅ WebRTC signaling
    socket.on("signal", ({ to, data }) => {
      if (io.sockets.sockets.get(to)) {
        io.to(to).emit("signal", { from: socket.id, data });
      }
    });

    // ✅ Handle user ending chat manually
    socket.on("end-chat", ({ partnerId }) => {
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("partner-left");
        pairs.delete(partnerId);
      }
      pairs.delete(socket.id);
      console.log(`🔚 Chat ended between ${socket.id} and ${partnerId}`);
    });

    // ✅ Handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);

      if (waitingUser && waitingUser.id === socket.id) waitingUser = null;

      const partnerId = pairs.get(socket.id);
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("partner-left");
        pairs.delete(partnerId);
      }
      pairs.delete(socket.id);
    });

    // ✅ Demo Mode pairing simulation
    socket.on("start-demo", () => {
      console.log("🎬 Demo mode for:", socket.id);
      socket.emit("demo-start", {
        message: "Welcome to demo mode! Simulated chat started.",
      });
    });
  });
};


