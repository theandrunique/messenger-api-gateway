import { Server } from "socket.io";
import { handleMessageEvent } from "./handlers/message.handler";

type EventHandler = (io: Server, payload: unknown) => Promise<void>;

export interface EventHandlerMap {
  [key: string]: EventHandler;
}

export const EventHandlers: EventHandlerMap = {
  MessageCreated: handleMessageEvent,
};
