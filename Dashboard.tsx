import { useBotStatus } from "@/hooks/use-bot";
import { StatusCard } from "@/components/StatusCard";
import { ControlPanel } from "@/components/ControlPanel";
import { Zap } from "lucide-react";

export default function Dashboard() {
  const { data: status, isLoading } = useBotStatus();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-6xl space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-violet-400 to-indigo-400">
                Nexus
              </span>
              <span className="text-white/20 font-light">Control</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Advanced interface for managing your Discord automation agent.
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>v2.4.0 Stable</span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 xl:col-span-4 h-full">
            <ControlPanel isRunning={status?.isRunning ?? false} />
          </div>

          {/* Right Column: Status Visualization */}
          <div className="lg:col-span-7 xl:col-span-8 h-full">
            <div className="flex flex-col gap-6 h-full">
              <StatusCard status={status} isLoading={isLoading} />
              
              {/* Additional aesthetic filler blocks to make the dashboard look populated */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                 <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group cursor-default hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-display text-white group-hover:text-glow transition-all">
                         {status?.isRunning ? "Active" : "Idle"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Command Stream</div>
                    </div>
                 </div>

                 <div className="glass-card rounded-3xl p-6 flex flex-col justify-between group cursor-default hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-display text-white group-hover:text-glow transition-all">
                        {status?.isRunning ? "12ms" : "0ms"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Gateway Latency</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
