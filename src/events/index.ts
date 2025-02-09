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

      const parsedEvents = parseRedisEvents(events);

      await Promise.all(
        parsedEvents.map(async ({ messageId, eventType, payload }) => {
          try {
            if (isValidEventType(eventType) && EventHandlers[eventType]) {
              await EventHandlers[eventType](io, payload);
              await redisClient.xack(EVENT_STREAM, GROUP_NAME, messageId);
            } else {
              logger.error(`Unknown event type: ${eventType}`);
            }
          } catch (err) {
            logger.error(`Error processing event ${messageId}:`, err);
          }
        })
      );
      logger.info(`Processed batch of ${parsedEvents.length} events`);
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

type StreamMessage = {
  messageId: string;
  eventType: string;
  payload: any;
};

function parseRedisEvents(rawEvents: unknown): StreamMessage[] {
  if (!Array.isArray(rawEvents)) {
    throw new Error("Invalid Redis response format");
  }

  return rawEvents.flatMap(([stream, messages]) => {
    if (!Array.isArray(messages)) {
      throw new Error(`Invalid message format in stream: ${stream}`);
    }

    return messages.map(([messageId, data]: [string, string[]]) => {
      if (
        typeof messageId !== "string" ||
        !Array.isArray(data) ||
        data.length % 2 !== 0
      ) {
        throw new Error("Malformed Redis message data");
      }

      const fields: Record<string, string> = {};
      for (let i = 0; i < data.length; i += 2) {
        fields[data[i]] = data[i + 1];
      }

      const eventType = fields.eventType as string;
      const payload = fields.payload as string;
      if (!eventType || !payload) {
        throw new Error("Missing required event fields: eventType or payload");
      }

      try {
        const parsedPayload = JSON.parse(payload);
        return { messageId, eventType, payload: parsedPayload };
      } catch (e) {
        throw new Error(`Invalid JSON payload for message ${messageId}`);
      }
    });
  });
}
