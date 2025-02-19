import { Server } from "socket.io";
import logger from "../../utils/logging";
import {
  ChannelCreateEventSchema,
  ChannelMemberAddEventSchema,
  ChannelMemberRemoveEventSchema,
} from "../../schemas/channel.schema";
import { fromZodError } from "zod-validation-error";

export const handleChannelCreateEvent = async (io: Server, data: any) => {
  const parseResult = ChannelCreateEventSchema.safeParse(data);

  if (!parseResult.success) {
    const error = fromZodError(parseResult.error);
    logger.error(`Event validation failed: ${error}`);
    throw new Error(`Event validation failed. Error: ${error}`);
  }

  const { recipients, payload } = parseResult.data;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit("channel:new", {
      payload: payload,
    });
  });
};

export const handleChannelMemberAddEvent = async (io: Server, data: any) => {
  const parseResult = ChannelMemberAddEventSchema.safeParse(data);

  if (!parseResult.success) {
    const error = fromZodError(parseResult.error);
    logger.error(`Event validation failed: ${error}`);
    throw new Error(`Event validation failed. Error: ${error}`);
  }

  const { recipients, channelId, user } = parseResult.data;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit("channel:member-add", {
      channelId: channelId,
      user: user,
    });
  });
};

export const handleChannelMemberRemoveEvent = async (io: Server, data: any) => {
  const parseResult = ChannelMemberRemoveEventSchema.safeParse(data);

  if (!parseResult.success) {
    const error = fromZodError(parseResult.error);
    logger.error(`Event validation failed: ${error}`);
    throw new Error(`Event validation failed. Error: ${error}`);
  }

  const { recipients, channelId, user } = parseResult.data;

  recipients.forEach((userId) => {
    io.to(`user-${userId}`).emit("channel:member-remove", {
      channelId: channelId,
      user: user,
    });
  });
};
