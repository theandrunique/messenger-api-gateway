import * as dotenv from "dotenv";
import * as os from "os";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

dotenv.config();

const ConfigSchema = z.object({
  PORT: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().default(3000)
  ),
  JWKS_URL: z.string().default("https://localhost:8000/.well-known/jwks.json"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  EVENT_BATCH_SIZE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().default(100)
  ),
  EVENT_STREAM: z.string().default("gateway-events"),
  CONSUMER_GROUP_NAME: z.string().default("socket-consumers"),
  CONSUMER_NAME: z.string().default(`socket-worker-${os.hostname()}`),
  DEAD_EVENTS_STREAM: z.string().default("gateway-dead-events"),

  // cors
  CORS_ORIGIN: z.preprocess(
    (val) => {
      const value = String(val || "");
      return value ? value.split(",") : [];
    },
    z.array(z.string()).default(["http://localhost:5173"])
  ),
    CORS_METHODS: z.preprocess(
    (val) => {
      const value = String(val || "");
      return value ? value.split(",") : [];
    },
    z.array(z.string()).default(["GET", "POST"])
  ),
  CORS_ALLOWED_HEADERS: z.preprocess(
    (val) => {
      const value = String(val || "");
      return value ? value.split(",") : [];
    },
    z.array(z.string()).default(["Authorization"])
  ),
  CORS_CREDENTIALS: z.preprocess(
    (val) => (val === "true"),
    z.boolean().default(true)
  ),
});

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  const error = fromZodError(parsedConfig.error);
  throw new Error(`Config validation failed. Error: ${error}`);
}

export default parsedConfig.data;
