import { z } from "zod";

const ChannelMember = z.object({
  userId: z.string(),
  readAt: z.string(),
  username: z.string(),
  globalName: z.string(),
  image: z.string().nullable(),
});

const LastMessageSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorUsername: z.string(),
  authorGlobalName: z.string(),
  content: z.string(),
  timestamp: z.string(),
  editedTimestamp: z.string().nullable(),
  attachmentsCount: z.number(),
});

const ChannelSchema = z.object({
  id: z.string(),
  ownerId: z.string().nullable(),
  title: z.string().nullable(),
  image: z.string().nullable(),
  type: z.string(),
  lastMessageTimestamp: z.string().datetime().nullable(),
  lastMessage: LastMessageSchema.nullable(),
  members: z.array(ChannelMember),
});

export const ChannelCreateEventSchema = z.object({
  recipients: z.array(z.string()),
  payload: ChannelSchema,
  eventType: z.literal("CHANNEL_CREATE"),
});
