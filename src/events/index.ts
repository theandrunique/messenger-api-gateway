import { Server } from "socket.io";
import { redisClient } from "../services/redis.service";
import { EventHandlerMap, EventHandlers } from "./event.types";
import logger from "../utils/logging";
import config from "../config";

const EVENT_STREAM = "gateway-events";
const GROUP_NAME = "socket-consumers";

export const setupEventConsumers = async (io: Server) => {
  try {
    await redisClient
      .xgroup("CREATE", EVENT_STREAM, GROUP_NAME, "0", "MKSTREAM")
      .catch(() => logger.info("Consumer group already exists"));

    processEvents(io);
  } catch (err) {
    logger.error("Failed to setup event consumers:", err);
  }
};

const processEvents = async (io: Server) => {
  while (true) {
    try {
      const events = await redisClient.xreadgroup(
        "GROUP",
        GROUP_NAME,
        "socket-worker",
        "COUNT",
        config.EVENT_BATCH_SIZE,
        "STREAMS",
        EVENT_STREAM,
        ">"
      );

      if (!events) continue;

      for (const [stream, messages] of events) {
        await Promise.all(
          messages.map(async ([messageId, data]) => {
            const parsedData: Record<string, string> = {};
            for (let i = 0; i < data.length; i += 2) {
              parsedData[data[i]] = data[i + 1];
            }
            try {
              const eventType = parsedData.eventType as string;

              if (isValidEventType(eventType) && EventHandlers[eventType]) {
                await EventHandlers[eventType](
                  io,
                  JSON.parse(parsedData.payload)
                );
                await redisClient.xack(EVENT_STREAM, GROUP_NAME, messageId);
              } else {
                logger.error(`Unknown event type: ${eventType}`);
              }
            } catch (err) {
              logger.error(`Error processing event ${data.eventId}:`, err);
            }
          })
        );
        logger.info(`Processed batch of ${messages.length} events`);
      }
    } catch (err) {
      logger.error("Event processing error:", err);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

function isValidEventType(
  eventType: string
): eventType is keyof EventHandlerMap & string {
  return eventType in EventHandlers;
}
