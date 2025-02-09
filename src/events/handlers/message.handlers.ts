import { Server } from "socket.io";
import logger from "../../utils/logging";
import {
  MessageCreateEventSchema,
  MessageUpdateEventSchema,
} from "../../schemas/message.schema";
import { fromZodError } from "zod-validation-error";

export const handleMessageCreateEvent = async (io: Server, data: any) => {
  const parseResult = MessageCreateEventSchema.safeParse(data);

  if (!parseResult.success) {
    const error = fromZodError(parseResult.error);
    logger.error(`Event validation failed: ${error}`);
    throw new Error(`Event validation failed. Error: ${error}`);
  }

  const { recipients, payload, extra } = parseResult.data;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit("message:new", {
      payload: payload,
      extra: extra,
    });
  });
};

export const handleMessageUpdateEvent = async (io: Server, data: any) => {
  const parseResult = MessageUpdateEventSchema.safeParse(data);

  if (!parseResult.success) {
    const error = fromZodError(parseResult.error);
    logger.error(`Event validation failed: ${error}`);
    throw new Error(`Event validation failed. Error: ${error}`);
  }

  const { recipients, payload, extra } = parseResult.data;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit("message:update", {
      payload: payload,
      extra: extra,
    });
  });
};
