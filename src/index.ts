import { createAdapter } from "@socket.io/redis-streams-adapter";
import { Server, Socket } from "socket.io";
import logger from "./utils/logging";
import { redisClient } from "./services/redis.service";
import { authMiddleware } from "./middlewares/auth.middleware";
import config from "./config";
import { GatewayEventConsumer } from "./events";
import { setupOnlineTrackerHandlers } from "./services/online.service";

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const sessionId = socket.data.sessionId;
    if (!userId || !sessionId) {
      throw new Error(
        "Expected 'socket.data.userId' and 'socket.data.sessionId' to be set after 'authMiddleware'"
      );
    }

    logger.info(`Client connected: ${socket.id} (User: ${userId})`);

    socket.join(`user-${userId}`);

    socket.emit("hello", { userId, sessionId });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id} (User: ${userId})`);
    });

    socket.on("error", (err) => {
      logger.error(`Socket error: ${socket.id} (User: ${userId})`, err);
    });

  });
  setupOnlineTrackerHandlers(io);
};

async function initServer() {
  logger.info("Starting server...");

  const io = new Server({
    adapter: createAdapter(redisClient),
    cors: {
      origin: config.CORS_ORIGIN,
      methods: config.CORS_METHODS,
      allowedHeaders: config.CORS_ALLOWED_HEADERS,
      credentials: config.CORS_CREDENTIALS,
    },
  });

  const eventConsumer = new GatewayEventConsumer(io);
  await eventConsumer.start();

  io.use(authMiddleware);

  setupSocketHandlers(io);

  io.listen(config.PORT);
  logger.info(`Server started on port ${config.PORT}`);
}

initServer().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
