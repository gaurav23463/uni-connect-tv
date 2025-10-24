let waitingUser = null;

export const videoSocketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // Find a random partner
    socket.on("find-partner", () => {
      if (waitingUser && waitingUser !== socket.id) {
        const partnerId = waitingUser;
        io.to(socket.id).emit("partner-found", partnerId);
        io.to(partnerId).emit("partner-found", socket.id);
        waitingUser = null;
      } else {
        waitingUser = socket.id;
        io.to(socket.id).emit("waiting");
      }
    });

    // WebRTC signaling
    socket.on("signal", ({ to, data }) => {
      io.to(to).emit("signal", { from: socket.id, data });
    });

    socket.on("end-chat", ({ partnerId }) => {
      io.to(partnerId).emit("partner-left");
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
      if (waitingUser === socket.id) waitingUser = null;
      io.emit("partner-left", socket.id);
    });
  });
};
