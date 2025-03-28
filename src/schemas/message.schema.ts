import { z } from "zod";

export const MessageCreateEventSchema = z.object({
  recipients: z.array(z.string()),
  payload: z.unknown(),
  extra: z.unknown(),
  eventType: z.literal("MESSAGE_CREATE"),
});

export const MessageUpdateEventSchema = z.object({
  recipients: z.array(z.string()),
  payload: z.unknown(),
  extra: z.unknown(),
  eventType: z.literal("MESSAGE_UPDATE"),
});

export const MessageAckEventSchema = z.object({
  recipients: z.array(z.string()),
  channelId: z.unknown(),
  messageId: z.unknown(),
  memberId: z.unknown(),
  eventType: z.literal("MESSAGE_ACK"),
});
