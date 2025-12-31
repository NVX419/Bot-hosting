import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startBotSchema, type StartBotRequest } from "@shared/schema";
import { useStartBot, useStopBot } from "@/hooks/use-bot";
import { Bot, Power, Key, Loader2, Play } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface ControlPanelProps {
  isRunning: boolean;
}

export function ControlPanel({ isRunning }: ControlPanelProps) {
  const startBot = useStartBot();
  const stopBot = useStopBot();
  const [showToken, setShowToken] = useState(false);

  const form = useForm<StartBotRequest>({
    resolver: zodResolver(startBotSchema),
    defaultValues: {
      token: "",
    },
  });

  const onStart = (data: StartBotRequest) => {
    startBot.mutate(data);
  };

  const onStop = () => {
    stopBot.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card rounded-3xl p-8 h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display">Control Center</h2>
        </div>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Manage your bot instance. Ensure you have a valid token from the Discord Developer Portal before starting.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onStart)} className="space-y-6">
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase tracking-wider font-semibold text-muted-foreground ml-1">Bot Token</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        type={showToken ? "text" : "password"}
                        placeholder="Paste your bot token here..."
                        disabled={isRunning || startBot.isPending}
                        className="pl-10 h-12 bg-black/20 border-white/5 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />

            {!isRunning ? (
              <button
                type="submit"
                disabled={startBot.isPending}
                className="w-full h-14 rounded-xl font-semibold text-lg flex items-center justify-center gap-2
                  bg-gradient-to-r from-primary to-violet-500 
                  text-white shadow-lg shadow-primary/25
                  hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-md
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  transition-all duration-300 ease-out"
              >
                {startBot.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Start System
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                Bot is currently active and running.
              </div>
            )}
          </form>
        </Form>
      </div>

      {isRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 pt-6 border-t border-white/5"
        >
          <button
            onClick={onStop}
            disabled={stopBot.isPending}
            className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2
              bg-red-500/10 text-red-400 border border-red-500/20
              hover:bg-red-500/20 hover:border-red-500/30
              transition-all duration-200"
          >
            {stopBot.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            Terminate Session
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
