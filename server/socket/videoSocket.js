// server/socket/videoSocket.js
export function videoSocketHandler(io) {
  // queue: array of socket ids waiting
  const waitingQueue = [];
  // map socketId -> partnerId
  const partners = new Map();

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    // when a user wants a partner
    socket.on("find-partner", () => {
      console.log("find-partner from", socket.id);

      // if socket already paired, ignore (or ask to rejoin)
      if (partners.has(socket.id)) {
        console.log("already paired:", socket.id);
        return;
      }

      // clean waitingQueue of any disconnected sockets (safety)
      while (waitingQueue.length && !io.sockets.sockets.get(waitingQueue[0])) {
        waitingQueue.shift();
      }

      if (waitingQueue.length === 0) {
        // push this socket into queue
        waitingQueue.push(socket.id);
        socket.emit("waiting");
        console.log("queued", socket.id);
        return;
      }

      // pair with earliest waiting
      const partnerId = waitingQueue.shift();
      if (!io.sockets.sockets.get(partnerId)) {
        // partner vanished, try again recursively
        socket.emit("waiting");
        return;
      }

      partners.set(socket.id, partnerId);
      partners.set(partnerId, socket.id);

      socket.emit("partner-found", partnerId);
      io.to(partnerId).emit("partner-found", socket.id);
      console.log(`paired ${socket.id} <-> ${partnerId}`);
    });

    // signal relay
    socket.on("signal", ({ to, data }) => {
      if (!to) return;
      const dest = io.sockets.sockets.get(to);
      if (dest) {
        dest.emit("signal", { from: socket.id, data });
      }
    });

    // chat message relay to partner only
    socket.on("chatMessage", (msg) => {
      const partnerId = partners.get(socket.id);
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("chatMessage", { from: socket.id, msg });
      }
    });

    socket.on("end-chat", () => {
      const partnerId = partners.get(socket.id);
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("partner-left");
        partners.delete(partnerId);
      }
      partners.delete(socket.id);
    });

    // graceful disconnect cleanup
    socket.on("disconnect", (reason) => {
      console.log("disconnect", socket.id, reason);

      // remove from waiting queue
      const idx = waitingQueue.indexOf(socket.id);
      if (idx !== -1) waitingQueue.splice(idx, 1);

      const partnerId = partners.get(socket.id);
      if (partnerId && io.sockets.sockets.get(partnerId)) {
        io.to(partnerId).emit("partner-left");
        partners.delete(partnerId);
      }
      partners.delete(socket.id);
    });
  });
}

