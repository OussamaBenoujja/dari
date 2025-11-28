import { Server } from "socket.io";

let ioInstance: Server | null = null;

export const registerSocketServer = (server: Server) => {
  ioInstance = server;
};

export const getSocketServer = () => {
  if (!ioInstance) {
    throw new Error("Socket server not initialized");
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!ioInstance) {
    return;
  }
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

export const emitToUsers = (userIds: string[], event: string, payload: unknown) => {
  if (!ioInstance || userIds.length === 0) {
    return;
  }
  const rooms = userIds.map((id) => `user:${id}`);
  ioInstance.to(rooms).emit(event, payload);
};
