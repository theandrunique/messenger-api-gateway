import { Server } from "socket.io";
import logger from "../../utils/logging";
import { MessageEventSchema } from "../../schemas/message.schema";
import { fromZodError } from "zod-validation-error";

export const handleMessageEvent = async (io: Server, payload: any) => {
  try {
    const result = MessageEventSchema.safeParse(payload);

    if (!result.success) {
      const error = fromZodError(result.error);
      logger.error(`Event validation failed: ${error}`);
      return;
    }

    const { recipients, message } = result.data;

    recipients.forEach((userId) => {
      io.to(`user-${userId}`).emit("message:new", {
        message: message,
      });
    });

    logger.info(
      `Processed message event ${message.id} for ${recipients.length} users`
    );
  } catch (err) {
    logger.error("Error processing message event:", err);
  }
};
