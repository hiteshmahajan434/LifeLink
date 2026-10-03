import { Server } from "socket.io";
import { verifyToken } from "../utils/jwtService.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  // Authenticate every socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = verifyToken(token);

      socket.user = decoded;

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  console.log("User:", socket.user);

  const { id, role } = socket.user;

  if (role === "AMBULANCE") {
    socket.join(`ambulance:${id}`);
    console.log(`Joined room: ambulance:${id}`);
  }

  if (role === "HOSPITAL") {
    socket.join(`hospital:${id}`);
    console.log(`Joined room: hospital:${id}`);
  }

  // Test room event
  socket.on("test:room", ({ room, message }) => {
    console.log(`Test event requested for room: ${room}`);

    io.to(room).emit("test:message", {
      message,
      sentAt: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};