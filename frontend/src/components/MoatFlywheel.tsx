"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Zap, Database, Brain } from "lucide-react";

export function MoatFlywheel() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="inline-flex cursor-pointer"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <Badge className="bg-zinc-900 border-2 border-emerald-500/50 text-emerald-300 hover:bg-zinc-800 hover:border-emerald-500 transition-all px-3 py-1.5 font-semibold text-xs shadow-lg shadow-emerald-500/20">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Flywheel Active
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 bg-zinc-950 border-2 border-emerald-500 text-white shadow-2xl shadow-emerald-500/30 p-0"
        side="bottom"
        align="center"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-950/50 border-b-2 border-emerald-600 px-4 py-3">
          <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Adversarial Learning Loop
          </h3>
          <p className="text-xs text-emerald-400/70 mt-1">Technical Moat</p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Data Capture */}
          <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300 mb-1">Negative Logic Dataset</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Every human-validated omission is captured into a proprietary <strong className="text-emerald-400">Negative Logic dataset</strong> — the legal risks that <em>aren't</em> present in the text.
                </p>
              </div>
            </div>
          </div>

          {/* Fine-Tuning */}
          <div className="bg-zinc-900/50 border-2 border-zinc-800 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-900/50 border-2 border-emerald-600 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300 mb-1">Skeptic Agent Training</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  This fine-tunes the Skeptic agent to detect <strong className="text-emerald-400">high-stakes legal silence</strong> missed by general LLMs.
                </p>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 border-2 border-emerald-600 rounded-lg p-3">
            <p className="text-xs text-emerald-200 leading-relaxed">
              <strong className="text-emerald-300">The Moat:</strong> While competitors train on what's <em>present</em> in contracts, Quorum learns from what's <strong className="text-white">missing</strong> — building an unfair advantage in spotting "The Empty Space."
            </p>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-slow"></div>
              <span className="text-xs text-zinc-400 font-mono">Live Data Engine</span>
            </div>
            <span className="text-xs text-zinc-500 font-mono">v2.1.0</span>
          </div>
        </div>
      </PopoverContent>

      {/* Custom Animation for Slow Ping */}
      <style jsx global>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </Popover>
  );
}
