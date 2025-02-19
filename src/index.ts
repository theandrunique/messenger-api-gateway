import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Server, Socket } from "socket.io";
import logger from "./utils/logging";
import { redisClient } from "./services/redis.service";
import { authMiddleware } from "./middlewares/auth.middleware";
import config from "./config";
import { setupEventConsumers } from "./events";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    if (!userId) {
      throw new Error(
        "Expected 'socket.data.userId' to be set after 'authMiddleware'"
      );
    }

    logger.info(`Client connected: ${socket.id} (User: ${userId})`);

    socket.join(`user-${userId}`);

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id} (User: ${userId})`);
    });

    socket.on("error", (err) => {
      logger.error(`Socket error for user ${userId}:`, err);
    });
  });
};

async function initServer() {
  logger.info("Starting server...");

  const io = new Server({
    adapter: createAdapter(redisClient),
  });

  await setupEventConsumers(io);

  io.use(authMiddleware);

  setupSocketHandlers(io);

  io.listen(config.PORT);
  logger.info(`Server started on port ${config.PORT}`);
}

initServer().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
