import { Server } from "socket.io";
import { GatewayEvent } from "./helpers";

type EventHandler = (io: Server, event: GatewayEvent) => Promise<void>;

const handleGatewayEvent: EventHandler = async (
  io: Server,
  event: GatewayEvent
) => {
  const { recipients, payload, eventType } = event;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit(eventType, payload);
  });
};

export default handleGatewayEvent;
