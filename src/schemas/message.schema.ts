import { z } from "zod";

const AuthorSchema = z.object({
  id: z.string(),
  username: z.string(),
  globalName: z.string(),
  image: z.string().nullable(),
});

const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  author: AuthorSchema,
  content: z.string(),
  timestamp: z.string(),
  editedTimestamp: z.string().nullable(),
  attachments: z.array(z.unknown()),
});

export const MessageEventSchema = z.object({
  recipients: z.array(z.string()),
  message: MessageSchema,
  eventType: z.literal("MessageCreated"),
});
