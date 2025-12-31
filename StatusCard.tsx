import { motion } from "framer-motion";
import { Activity, Clock, ShieldCheck, PowerOff } from "lucide-react";
import { type BotStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface StatusCardProps {
  status: BotStatus | undefined;
  isLoading: boolean;
}

export function StatusCard({ status, isLoading }: StatusCardProps) {
  const isRunning = status?.isRunning ?? false;

  const uptimeString = status?.uptime 
    ? formatDistanceToNow(Date.now() - status.uptime * 1000)
    : "Offline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card rounded-3xl p-8 relative overflow-hidden"
    >
      {/* Background Gradient Blob */}
      <div 
        className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${
          isRunning ? "bg-green-500" : "bg-red-500"
        }`} 
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-wider text-xs">System Status</h2>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isRunning 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {isRunning ? "ONLINE" : "OFFLINE"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Bot Identity</span>
            </div>
            <div className="text-2xl font-bold font-display text-white truncate">
              {status?.botName || "Unknown Agent"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>Uptime</span>
            </div>
            <div className="text-2xl font-bold font-display text-white font-mono">
              {isRunning ? uptimeString : "—"}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className={`relative flex h-3 w-3`}>
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isRunning ? "bg-green-500" : "bg-red-500"
              }`}></span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isRunning 
                ? "Systems nominal. Listening for commands." 
                : "System halted. Waiting for manual start."}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
