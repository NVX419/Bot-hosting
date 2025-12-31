import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type BotStatus } from "@shared/routes";
import { type StartBotRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBotStatus() {
  return useQuery({
    queryKey: [api.bot.status.path],
    queryFn: async () => {
      const res = await fetch(api.bot.status.path);
      if (!res.ok) throw new Error("Failed to fetch bot status");
      // Use the Zod schema from routes to parse
      const data = await res.json();
      return api.bot.status.responses[200].parse(data);
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useStartBot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: StartBotRequest) => {
      const validated = api.bot.start.input.parse(data);
      const res = await fetch(api.bot.start.path, {
        method: api.bot.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.bot.start.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to start bot");
      }
      return api.bot.start.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
      toast({
        title: "Bot Started",
        description: data.message,
        className: "bg-green-500/10 border-green-500/20 text-green-500",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useStopBot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.bot.stop.path, {
        method: api.bot.stop.method,
      });

      if (!res.ok) throw new Error("Failed to stop bot");
      return api.bot.stop.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
      toast({
        title: "Bot Stopped",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
