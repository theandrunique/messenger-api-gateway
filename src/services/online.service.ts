import Redis from "ioredis";
import { Server } from "socket.io";
import { redisClient } from "./redis.service";
import logger from "../utils/logging";

export class OnlineStatusService {
  private redis: Redis;
  private readonly keyPrefix = "online_user:";
  private readonly ttl = 40;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async setOnline(userId: string) {
    await this.redis.set(this.getKey(userId), "1", "EX", this.ttl);
  }

  async setOffline(userId: string) {
    await this.redis.del(this.getKey(userId));
  }

  async isOnline(userId: string) {
    const res = await this.redis.exists(this.getKey(userId));
    return res === 1;
  }

  private getKey(userId: string): string {
    return `${this.keyPrefix}${userId}`;
  }
}

export const onlineStatusService = new OnlineStatusService(redisClient);

export function setupOnlineTrackerHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("online_status_sub", async (userId: string) => {
      if (!userId) {
        logger.warn("No userId found in request data");
        return;
      }

      socket.join(`online-status-watch:${userId}`);

      const isOnline = await onlineStatusService.isOnline(userId);
      socket.emit("online_status_update", {
        userId: userId,
        isOnline: isOnline,
      });
    });

    socket.on("online_status_unsub", (userId: string) => {
      if (!userId) {
        logger.warn("No userId found in request data");
        return;
      }

      socket.leave(`online-status-watch:${userId}`);
    });

    socket.on("online-ping", async () => {
      const currentUserId: string = socket.data.userId;
      if (!currentUserId) {
        logger.warn("No user id found in socket data");
        return;
      }

      await onlineStatusService.setOnline(currentUserId);
      socket
        .to(`online-status-watch:${currentUserId}`)
        .emit("online_status_update", {
          userId: currentUserId,
          isOnline: true,
        });

    });
  });
}
