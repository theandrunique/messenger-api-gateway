import Redis from "ioredis";
import logger from "../utils/logging";
import config from "../config";

class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis(config.REDIS_URL);
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.client.on("error", (err) => {
      logger.error(`Redis error: ${err}`);
    });
    this.client.on("connect", () => {
      logger.info("Connected to Redis");
    });

    this.client.on("reconnecting", () => {
      logger.warn("Reconnecting to Redis...");
    });
  }

  public getClient(): Redis {
    return this.client;
  }
}

const redisService = new RedisService();

export const redisClient = redisService.getClient();
