import { Server } from "socket.io";
import logger from "../../utils/logging";
import { ChannelCreateEventSchema } from "../../schemas/channel.schema";
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
