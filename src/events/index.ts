import { Server } from "socket.io";
import { EventHandlerMap, EventHandlers } from "./event.types";
import logger from "../utils/logging";
import { GatewayEvent, RedisGatewayStream } from "./helpers";

export class GatewayEventConsumer {
  private gatewayStream: RedisGatewayStream;
  private io: Server;
  private isRunning = false;

  constructor(io: Server) {
    this.gatewayStream = new RedisGatewayStream();
    this.io = io;
  }

  async start() {
    this.isRunning = true;
    logger.info("Starting event consumer...");
    await this.gatewayStream.createConsumerGroup();
    this.processEvents();
  }

  async stop() {
    this.isRunning = false;
    logger.info("Stopping event consumer...");
  }

  private async processEvents() {
    while (this.isRunning) {
      try {
        const events = await this.gatewayStream.fetchEvents();
        if (events.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        await Promise.all(events.map((event) => this.processEvent(event)));
        logger.info(`Processed batch of ${events.length} events`);
      } catch (e) {
        logger.error("Error processing gateway events: ", e);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async processEvent(event: GatewayEvent) {
    const { messageId, eventType, payload } = event;
    try {
      if (isValidEventType(eventType)) {
        await EventHandlers[eventType](this.io, payload);
        await this.gatewayStream.acknowledgeEvent(messageId);
      } else {
        logger.warn(`Unknown event type: ${eventType}`, { messageId });
        await this.gatewayStream.moveToDeadEventsQueueAndAck(
          event,
          `Unknown event type: ${eventType}`
        );
      }
    } catch (err) {
      await this.gatewayStream.moveToDeadEventsQueueAndAck(event, String(err));
      logger.warn(`Error processing event ${messageId}. Error: {err}`);
    }
  }
}

function isValidEventType(
  eventType: string
): eventType is keyof EventHandlerMap & string {
  return eventType in EventHandlers;
}
