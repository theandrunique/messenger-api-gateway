import { Socket } from "socket.io";
import logger from "../utils/logging";
import { validateJWT } from "../utils/auth";

export const authMiddleware = async (socket: Socket, next: any) => {
  const token = socket.handshake.query.accessToken as string;

  if (!token) {
    logger.info(`No access token provided. Socket id: ${socket.id}`);
    return next(new Error("Authentication error: No access token provided"));
  }

  const payload = await validateJWT(token);

  if (payload === null) {
    logger.info(`Invalid access token. Socket id: ${socket.id}`);
    return next(new Error("Authentication error: Invalid access token"));
  }

  const userId = payload.sub as string;
  if (!userId) {
    return next(new Error("Authentication error: Invalid payload"));
  }

  socket.data.userId = userId;

  next();
};
