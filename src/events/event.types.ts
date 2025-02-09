import { Server } from "socket.io";
import {
  handleMessageCreateEvent,
  handleMessageUpdateEvent,
} from "./handlers/message.handler";
import { handleChannelCreateEvent } from "./handlers/channel.handler";

type EventHandler = (io: Server, data: unknown) => Promise<void>;

export interface EventHandlerMap {
  [key: string]: EventHandler;
}

export const EventHandlers: EventHandlerMap = {
  MESSAGE_CREATE: handleMessageCreateEvent,
  MESSAGE_UPDATE: handleMessageUpdateEvent,
  CHANNEL_CREATE: handleChannelCreateEvent,
};
