import { z } from "zod";

export const ChannelUpdateEventSchema = z.object({
  recipients: z.array(z.string()),
  payload: z.unknown(),
  eventType: z.literal("CHANNEL_UPDATE"),
})

export const ChannelCreateEventSchema = z.object({
  recipients: z.array(z.string()),
  payload: z.unknown(),
  eventType: z.literal("CHANNEL_CREATE"),
});

export const ChannelMemberAddEventSchema = z.object({
  recipients: z.array(z.string()),
  channelId: z.unknown(),
  user: z.unknown(),
  eventType: z.literal("CHANNEL_MEMBER_ADD"),
});

export const ChannelMemberRemoveEventSchema = z.object({
  recipients: z.array(z.string()),
  channelId: z.unknown(),
  user: z.unknown(),
  eventType: z.literal("CHANNEL_MEMBER_REMOVE"),
});
