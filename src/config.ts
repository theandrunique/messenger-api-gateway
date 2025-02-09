import * as dotenv from "dotenv";
import * as os from "os";

dotenv.config();

export default {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  JWKS_URL:
    process.env.JWKS_URL || "https://localhost:8000/.well-known/jwks.json",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  EVENT_BATCH_SIZE: 100,
  EVENT_STREAM: "gateway-events",
  CONSUMER_GROUP_NAME: "socket-consumers",
  CONSUMER_NAME: `socket-worker-${os.hostname()}`,
  DEAD_EVENTS_STREAM: "gateway-dead-events",
};
