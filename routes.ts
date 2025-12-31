import { z } from "zod";
import { startBotSchema, insertTicketSettingsSchema } from "./schema";

export const api = {
  bot: {
    start: {
      method: "POST" as const,
      path: "/api/bot/start",
      input: startBotSchema,
      responses: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    stop: {
      method: "POST" as const,
      path: "/api/bot/stop",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    status: {
      method: "GET" as const,
      path: "/api/bot/status",
      responses: {
        200: z.object({
          isRunning: z.boolean(),
          botName: z.string().optional(),
          uptime: z.number().optional(),
        }),
      },
    },
  },
  tickets: {
    getSettings: {
      method: "GET" as const,
      path: "/api/tickets/settings",
      responses: {
        200: insertTicketSettingsSchema.extend({ id: z.number() }),
      },
    },
    updateSettings: {
      method: "POST" as const,
      path: "/api/tickets/settings",
      input: insertTicketSettingsSchema.partial(),
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    stats: {
      method: "GET" as const,
      path: "/api/tickets/stats",
      responses: {
        200: z.object({
          openTickets: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
