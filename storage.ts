import { type BotConfig, type InsertBotConfig, botConfig, ticketSettings, type TicketSettings, type Ticket, tickets } from "@shared/schema";
import { db } from "./db";
import { eq, count } from "drizzle-orm";

export interface IStorage {
  getBotConfig(): Promise<BotConfig | undefined>;
  saveBotConfig(config: InsertBotConfig): Promise<BotConfig>;
  updateBotConfig(id: number, isActive: boolean): Promise<BotConfig>;
  getTicketSettings(): Promise<TicketSettings | undefined>;
  updateTicketSettings(settings: Partial<TicketSettings>): Promise<void>;
  createTicket(ticket: any): Promise<void>;
  getOpenTicketsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getBotConfig(): Promise<BotConfig | undefined> {
    const configs = await db.select().from(botConfig).limit(1);
    return configs[0];
  }

  async saveBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    const existing = await this.getBotConfig();
    if (existing) {
      const [updated] = await db
        .update(botConfig)
        .set(config)
        .where(eq(botConfig.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(botConfig).values(config).returning();
    return created;
  }

  async updateBotConfig(id: number, isActive: boolean): Promise<BotConfig> {
    const [updated] = await db
      .update(botConfig)
      .set({ isActive })
      .where(eq(botConfig.id, id))
      .returning();
    return updated;
  }

  async getTicketSettings(): Promise<TicketSettings | undefined> {
    const results = await db.select().from(ticketSettings).limit(1);
    if (results.length === 0) {
      const [created] = await db.insert(ticketSettings).values({}).returning();
      return created;
    }
    return results[0];
  }

  async updateTicketSettings(settings: Partial<TicketSettings>): Promise<void> {
    const existing = await this.getTicketSettings();
    if (existing) {
      await db.update(ticketSettings).set(settings).where(eq(ticketSettings.id, existing.id));
    }
  }

  async createTicket(ticket: any): Promise<void> {
    await db.insert(tickets).values(ticket);
  }

  async getOpenTicketsCount(): Promise<number> {
    const results = await db.select({ value: count() }).from(tickets).where(eq(tickets.status, "open"));
    return results[0]?.value || 0;
  }
}

export const storage = new DatabaseStorage();
