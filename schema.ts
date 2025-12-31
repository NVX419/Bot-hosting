import { pgTable, text, serial, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  isActive: boolean("is_active").default(false),
});

export const ticketSettings = pgTable("ticket_settings", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id"),
  logChannelId: text("log_channel_id"),
  messageTitle: text("message_title").default("فتح تكت"),
  messageDescription: text("message_description").default("اضغط على الزر أدناه لفتح تكت جديد"),
  imageUrl: text("image_url"),
  buttons: jsonb("buttons").$type<{ label: string; emoji?: string; style: number }[]>().default([]),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("open"),
});

export const insertBotConfigSchema = createInsertSchema(botConfig);
export const insertTicketSettingsSchema = createInsertSchema(ticketSettings);
export const insertTicketSchema = createInsertSchema(tickets);

export type BotConfig = typeof botConfig.$inferSelect;
export type TicketSettings = typeof ticketSettings.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;

export const startBotSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type StartBotRequest = z.infer<typeof startBotSchema>;

export type BotStatus = {
  isRunning: boolean;
  botName?: string;
  uptime?: number;
};
