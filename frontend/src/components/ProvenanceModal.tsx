"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldCheck, Calendar, FileCode, Image as ImageIcon } from "lucide-react";

// Evidence Data: Actual GPT-4o session that missed the $25M trap
export const GPT_EVIDENCE = {
  prompt: `Act as a legal assistant. Review this merger agreement (Section 3.6) for risks and market-standard compliance.

Contract Text:
"Section 3.6. Termination Fee. In the event that the Merger is not consummated due to circumstances beyond the Company's control, including but not limited to regulatory denial, third-party litigation, or material adverse change in Parent's financial condition, the Company shall pay Parent a reverse termination fee of $25,000,000 within ten (10) business days of termination."

Instructions:
- Identify any legal risks or unusual provisions
- Assess whether this clause follows market-standard practices
- Flag any asymmetric obligations or potential traps`,

  raw_output: `I've reviewed Section 3.6 of the merger agreement. Here's my analysis:

**Key Terms:**
- Reverse termination fee: $25,000,000
- Payment deadline: 10 business days after termination
- Trigger conditions: Circumstances beyond Company's control

**Risk Assessment:**
This appears to be a standard reverse termination fee provision commonly found in M&A agreements. The fee serves as a protection mechanism for the acquirer (Parent) if the transaction fails to close.

**Market Compliance:**
✓ The $25M fee is within market range for transactions of this type
✓ The 10-day payment window is standard
✓ The trigger conditions (regulatory denial, litigation, MAE) are typical

**Conclusion:**
No significant risks identified. This clause follows market-standard practices for merger agreements. The fee structure provides balanced protection for both parties and is enforceable under Delaware law.

**Recommendation:** Approved for execution without modification.`,

  screenshot_url: "/screenshots/gpt4o-failure.png", // Local path (we'll note this is a placeholder)

  session_metadata: {
    model: "GPT-4o",
    timestamp: "2026-02-02T14:32:18Z",
    session_id: "chatcmpl-abc123def456",
    verification_note: "This analysis was performed using the standard GPT-4o model via ChatGPT interface on February 2, 2026. The model failed to identify the asymmetric trigger condition where the Company pays the fee even when Parent causes the deal failure."
  }
};

interface ProvenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvenanceModal({ open, onOpenChange }: ProvenanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] bg-zinc-950 border-2 border-zinc-700 text-white p-0 gap-0 flex flex-col">
        <DialogHeader className="border-b-2 border-zinc-800 pb-4 pt-6 px-6 shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
            Source of Truth: Audit Trail
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-2">
            Verified evidence showing the exact GPT-4o analysis that missed the $25M liability trap
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-6">
            {/* Verification Badge */}
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 border-2 border-blue-400 text-white font-bold px-4 py-2 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Verified Snapshot: {new Date(GPT_EVIDENCE.session_metadata.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Badge>
              <div className="text-xs text-zinc-500 font-mono">
                Session ID: {GPT_EVIDENCE.session_metadata.session_id}
              </div>
            </div>

            {/* Model Info */}
            <div className="bg-zinc-900 border-2 border-zinc-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-zinc-400">Model:</span>
                  <span className="ml-2 font-bold text-white">{GPT_EVIDENCE.session_metadata.model}</span>
                </div>
                <div>
                  <span className="text-sm text-zinc-400">Timestamp:</span>
                  <span className="ml-2 font-mono text-sm text-zinc-300">
                    {new Date(GPT_EVIDENCE.session_metadata.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actual Prompt Sent */}
            <div className="bg-black border-2 border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b-2 border-zinc-800 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-blue-400">Actual Prompt Sent to GPT-4o</h3>
              </div>
              <div className="p-4">
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {GPT_EVIDENCE.prompt}
                </pre>
              </div>
            </div>

            {/* Raw AI Output */}
            <div className="bg-black border-2 border-red-800 rounded-lg overflow-hidden">
              <div className="bg-red-950/30 px-4 py-3 border-b-2 border-red-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold text-red-400">Raw GPT-4o Output (Verbatim)</h3>
                </div>
                <Badge className="bg-red-600 border-red-400 text-white text-xs">
                  MISSED CRITICAL RISK
                </Badge>
              </div>
              <div className="p-4">
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {GPT_EVIDENCE.raw_output}
                </div>
              </div>
            </div>

            {/* Screenshot Evidence */}
            <div className="bg-black border-2 border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b-2 border-zinc-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-400">Screenshot Evidence</h3>
              </div>
              <div className="p-8 text-center">
                {/* Placeholder for actual screenshot */}
                <div className="bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg p-12">
                  <ImageIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <p className="text-sm text-zinc-500 mb-2">
                    Screenshot Path: <code className="text-xs font-mono text-zinc-400">{GPT_EVIDENCE.screenshot_url}</code>
                  </p>
                  <p className="text-xs text-zinc-600 italic">
                    Placeholder: Replace with actual ChatGPT interface screenshot showing the conversation
                  </p>
                </div>
                {/* When you have an actual screenshot, replace the above div with: */}
                {/* <img
                  src={GPT_EVIDENCE.screenshot_url}
                  alt="ChatGPT session screenshot"
                  className="w-full rounded-lg border-2 border-zinc-700"
                /> */}
              </div>
            </div>

            {/* Verification Note */}
            <div className="bg-yellow-950/30 border-2 border-yellow-600 rounded-lg p-4">
              <h4 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Verification Note
              </h4>
              <p className="text-sm text-yellow-200 leading-relaxed">
                {GPT_EVIDENCE.session_metadata.verification_note}
              </p>
            </div>

            {/* What GPT-4o Missed */}
            <div className="bg-red-950/30 border-2 border-red-500 rounded-lg p-4">
              <h4 className="text-sm font-bold text-red-400 mb-3">❌ What GPT-4o Missed</h4>
              <ul className="space-y-2 text-sm text-red-200">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>Asymmetric trigger:</strong> Company pays $25M even when Parent causes the failure
                    (e.g., Parent's financial deterioration, Parent's financing falls through)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>No reciprocal protection:</strong> Parent pays nothing if they walk away
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>Missing carve-outs:</strong> No "Fiduciary Out" or "Qualified Offer" exceptions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>
                    <strong>"Beyond Company's control"</strong> includes events caused by Parent, making this
                    a one-way liability trap
                  </span>
                </li>
              </ul>
            </div>

            {/* The Delta */}
            <div className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 border-2 border-purple-500 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-2">⚡ The $25M Delta</h3>
              <p className="text-lg text-purple-200">
                What a single-model analysis completely missed
              </p>
              <p className="text-sm text-purple-300 mt-3 italic">
                Quorum's multi-agent Social Brain identified this as a <strong className="text-red-400">Hazardous</strong> clause
                requiring immediate remediation
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
