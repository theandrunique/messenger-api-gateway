import { Server } from "socket.io";
import {
  handleMessageAckEvent,
  handleMessageCreateEvent,
  handleMessageUpdateEvent,
} from "./handlers/message.handlers";
import {
  handleChannelCreateEvent,
  handleChannelMemberAddEvent,
  handleChannelMemberRemoveEvent,
  handleChannelUpdateEvent,
} from "./handlers/channel.handlers";

type EventHandler = (io: Server, data: unknown) => Promise<void>;

export interface EventHandlerMap {
  [key: string]: EventHandler;
}

export const EventHandlers: EventHandlerMap = {
  MESSAGE_CREATE: handleMessageCreateEvent,
  MESSAGE_UPDATE: handleMessageUpdateEvent,
  MESSAGE_ACK: handleMessageAckEvent,
  CHANNEL_CREATE: handleChannelCreateEvent,
  CHANNEL_UPDATE: handleChannelUpdateEvent,
  CHANNEL_MEMBER_ADD: handleChannelMemberAddEvent,
  CHANNEL_MEMBER_REMOVE: handleChannelMemberRemoveEvent,
};
