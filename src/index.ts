import { Socket } from "socket.io";
import { validateJWT } from "./auth";
import config from "./config";
import { Server } from "socket.io";
import logger from "./logging";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Redis } from "ioredis";

const redisClient = new Redis("127.0.0.1:6379");
const io = new Server({
  adapter: createAdapter(redisClient),
});

io.on("connection", async (socket: Socket) => {
  const accessToken = socket.handshake.query.accessToken as string;
  if (!accessToken) {
    logger.info("No access token provided");
    socket.disconnect(true);
    return;
  }

  const payload = await validateJWT(accessToken);
  if (payload === null) {
    logger.info(`Invalid access token: ${accessToken}`);
    socket.disconnect(true);
    return;
  }

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on("message", (message) => {
    logger.info(`Received message: ${JSON.stringify(message)}`);
  });

  logger.info(`Client connected ${socket.id}`);
});

io.listen(config.PORT);
