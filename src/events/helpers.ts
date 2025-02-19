import config from "../config";
import { redisClient } from "../services/redis.service";
import logger from "../utils/logging";

export class RedisGatewayStream {
  async createConsumerGroup() {
    try {
      await redisClient.xgroup(
        "CREATE",
        config.EVENT_STREAM,
        config.CONSUMER_GROUP_NAME,
        "0",
        "MKSTREAM"
      );
      logger.info("Consumer group created");
    } catch {
      logger.info("Consumer group already exists");
    }
  }

  async fetchEvents(): Promise<GatewayEvent[]> {
    const streamData = await redisClient.xreadgroup(
      "GROUP",
      config.CONSUMER_GROUP_NAME,
      config.CONSUMER_NAME,
      "COUNT",
      config.EVENT_BATCH_SIZE,
      "STREAMS",
      config.EVENT_STREAM,
      ">"
    );

    const messages = this.validateStreamResponse(streamData);
    return this.processMessages(messages);
  }

  private async processMessages(
    messages: RedisStreamMessage[]
  ): Promise<GatewayEvent[]> {
    const processedEvents: GatewayEvent[] = [];

    for (const message of messages) {
      try {
        const event = parseRedisEvent(message);
        processedEvents.push(event);
      } catch (err) {
        this.handleInvalidMessage(message, String(err));
      }
    }

    return processedEvents;
  }

  private validateStreamResponse(response: unknown): RedisStreamMessage[] {
    if (
      !Array.isArray(response) ||
      response.length === 0 ||
      !Array.isArray(response[0]) ||
      response[0].length < 2 ||
      !Array.isArray(response[0][1])
    ) {
      return [];
    }

    return response[0][1];
  }

  async acknowledgeEvent(id: string) {
    await redisClient
      .multi()
      .xack(config.EVENT_STREAM, config.CONSUMER_GROUP_NAME, id);
  }

  private async handleInvalidMessage(
    [messageId, fields]: RedisStreamMessage,
    error: string
  ): Promise<void> {
    await redisClient
      .multi()
      .xadd(
        config.DEAD_EVENTS_STREAM,
        "*",
        "originalId",
        messageId,
        "originalFields",
        JSON.stringify(fields),
        "error",
        error
      )
      .xack(config.EVENT_STREAM, config.CONSUMER_GROUP_NAME, messageId)
      .exec();

    logger.warn(`Event ${messageId} moved to dead events queue`);
  }

  async moveToDeadEventsQueueAndAck(event: GatewayEvent, err: string) {
    await redisClient
      .multi()
      .xadd(
        config.DEAD_EVENTS_STREAM,
        "*",
        "eventType",
        event.eventType,
        "payload",
        JSON.stringify(event.payload),
        "error",
        err
      )
      .xack(config.EVENT_STREAM, config.CONSUMER_GROUP_NAME, event.messageId)
      .exec();

    logger.warn(`Event ${event.messageId} moved to dead events queue`);
  }
}

function parseRedisEvent(rawEvent: RedisStreamMessage): GatewayEvent {
  const fields: Record<string, string> = {};
  const messageId = rawEvent[0];

  for (let i = 0; i < rawEvent[1].length; i += 2) {
    fields[rawEvent[1][i]] = rawEvent[1][i + 1];
  }

  if (!fields.eventType || !fields.payload) {
    throw new Error("Missing required event fields: eventType or payload");
  }

  try {
    return {
      messageId,
      eventType: fields.eventType,
      payload: JSON.parse(fields.payload),
    };
  } catch (e) {
    throw new Error(`Failed to parse payload for event ${messageId}: ${e}`);
  }
}

export type GatewayEvent = {
  messageId: string;
  eventType: string;
  payload: any;
};

type RedisStreamMessage = [string, string[]];
