// server/socket/videoSocket.js
export const videoSocketHandler = (io) => {
  let waitingUser = null; // store socket.id
  const pairs = new Map(); // socket.id -> partnerId

  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // find partner
    socket.on("find-partner", () => {
      if (waitingUser && waitingUser !== socket.id) {
        const partnerId = waitingUser;
        waitingUser = null;

        pairs.set(socket.id, partnerId);
        pairs.set(partnerId, socket.id);

        socket.emit("partner-found", partnerId);
        io.to(partnerId).emit("partner-found", socket.id);

        console.log(`✅ Paired: ${socket.id} ↔ ${partnerId}`);
      } else {
        waitingUser = socket.id;
        socket.emit("waiting");
        console.log("🕒 Waiting user:", socket.id);
      }
    });

    // relay webRTC signaling
    socket.on("signal", ({ to, data }) => {
      if (io.sockets.sockets.get(to)) {
        io.to(to).emit("signal", { from: socket.id, data });
      }
    });

    // private chat
    socket.on("chatMessage", ({ to, text }) => {
      // if front-end provides 'to' use it, otherwise fallback to mapped partner
      const partnerId = to || pairs.get(socket.id);
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("chatMessage", { text });
      }
    });

    // next partner
    socket.on("next-partner", () => {
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner-left");
        pairs.delete(partnerId);
      }
      pairs.delete(socket.id);
      waitingUser = socket.id;
      socket.emit("waiting");
    });

    // end chat
    socket.on("end-chat", () => {
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner-left");
        pairs.delete(partnerId);
      }
      pairs.delete(socket.id);
    });

    // disconnect cleanup
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      if (waitingUser === socket.id) waitingUser = null;
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner-left");
        pairs.delete(partnerId);
      }
      pairs.delete(socket.id);
    });
  });
};

