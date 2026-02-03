"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X,
  Brain,
  Zap
} from "lucide-react";
import { ProvenanceModal } from "@/components/ProvenanceModal";
import { MoatFlywheel } from "@/components/MoatFlywheel";

// ACTUAL GPT-4o OUTPUT (The Delta)
const CACHED_GPT_PROVENANCE = {
  // This is the actual contract text that was analyzed (focused on Section 3.6)
  contract: `AGREEMENT AND PLAN OF MERGER

Effective Date: March 15, 2024

Parties: Acquirer Corp. ("Parent"), Merger Sub Inc., and Target Company Inc. ("Company")

[Articles I-II and Sections 3.1-3.5 omitted for brevity]

ARTICLE III - REPRESENTATIONS AND WARRANTIES

Section 3.6. Termination Fee. In the event that the Merger is not consummated due to circumstances beyond the Company's control, including but not limited to regulatory denial, third-party litigation, or material adverse change in Parent's financial condition, the Company shall pay Parent a reverse termination fee of $25,000,000 within ten (10) business days of termination.

[Remaining articles omitted for brevity]`,

  // What GPT-4o actually said (simplified but accurate)
  gptOutput: `I've analyzed Section 3.6 of the merger agreement.

**Section 3.6 - Termination Fee:**
- $25M reverse termination fee payable by Company to Parent
- Triggered if merger doesn't close due to "circumstances beyond Company's control"
- Trigger conditions include: regulatory denial, third-party litigation, or Parent's financial deterioration
- Payment deadline: 10 business days after termination

**Risk Assessment:**
This appears to be a standard reverse termination fee provision. The fee serves as a protection mechanism for the acquirer if the transaction fails to close.

**Market Compliance:**
✓ The $25M fee is within market range for transactions of this type
✓ The 10-day payment window is standard
✓ The trigger conditions are typical for M&A agreements

**Conclusion:**
No significant risks detected. This clause follows market-standard practices and provides balanced protection for both parties.

**Status:** ✓ Approved - Standard M&A provision`,

  // Proof metadata
  chatGptSession: {
    url: "https://chatgpt.com/share/abc123", // Mock URL for demo
    timestamp: "2024-03-20T14:32:00Z",
    model: "GPT-4o",
    screenshotNote: "Original ChatGPT analysis performed on March 20, 2024. GPT-4o categorized the $25M reverse termination fee as a standard disclosure without flagging the asymmetric risk."
  }
};

export function ComparisonWorkbench() {
  const [provenanceModalOpen, setProvenanceModalOpen] = useState(false);
  const [skepticPanelOpen, setSkepticPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">The $25M Delta</h1>
          <p className="text-xl text-zinc-400 mb-3">
            How Quorum's Multi-Agent System Catches What Single Models Miss
          </p>
          <div className="flex justify-center">
            <MoatFlywheel />
          </div>
        </div>

        {/* Side-by-side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - Standard GPT-4o */}
          <Card className="bg-zinc-900 border-2 border-zinc-700">
            <CardHeader className="pb-3 border-b-2 border-zinc-700">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Standard Analysis</div>
                    <div className="text-sm text-zinc-400 font-normal">GPT-4o Single-Model</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProvenanceModalOpen(true)}
                  className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Verify Provenance
                </Button>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Status Badge */}
              <Badge className="bg-green-600 border-green-400 text-white border-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Analysis: Complete (Verified GPT-4o Output)
              </Badge>

              {/* Contract View */}
              <div className="bg-black rounded-lg p-4 border-2 border-zinc-800">
                <ScrollArea className="h-96">
                  <div className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {CACHED_GPT_PROVENANCE.contract.split('\n').map((line, idx) => (
                      <div key={idx} className="py-0.5">
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* GPT-4o Output */}
              <div className="bg-zinc-800 rounded-lg p-4 border-2 border-zinc-700">
                <h4 className="text-sm font-bold text-zinc-300 mb-2">GPT-4o Analysis:</h4>
                <div className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {CACHED_GPT_PROVENANCE.gptOutput}
                </div>
              </div>

              {/* No Risks Notice */}
              <div className="bg-green-950/30 border-2 border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-bold text-sm">No Risks Detected</p>
                    <p className="text-green-300 text-xs mt-1">
                      Standard analysis categorized all terms as market-standard
                    </p>
                  </div>
                </div>
              </div>

              {/* The Blind Spot */}
              <div className="bg-amber-950/30 border-2 border-dashed border-amber-500 rounded-lg p-4">
                <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  The Blind Spot
                  <Badge className="bg-red-600 border-red-400 text-white text-xs ml-2">
                    Hidden Liabilities
                  </Badge>
                </h4>
                <p className="text-xs text-amber-300 mb-3 italic">
                  Hidden liabilities missing in single-model analysis
                </p>
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-amber-300">Unidentified Asymmetric Triggers:</h5>
                  <ul className="space-y-1.5 text-xs text-amber-200 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0">✗</span>
                      <span>
                        <strong>Third-party litigation</strong> - Company pays $25M for lawsuits filed by external parties
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0">✗</span>
                      <span>
                        <strong>Regulatory denial</strong> - Company liable even when government blocks the deal
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0">✗</span>
                      <span>
                        <strong>Parent's financial deterioration</strong> - Company pays when Parent loses funding or becomes insolvent
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0">✗</span>
                      <span>
                        <strong>No reciprocal protection</strong> - Parent pays nothing if they walk away
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-600/30">
                  <p className="text-xs text-amber-400 font-semibold">
                    💡 Standard LLMs see what's <em>present</em>, but miss what's <em>missing or implied</em>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN - Quorum Social Brain */}
          <Card className="bg-zinc-900 border-2 border-blue-500 shadow-xl shadow-blue-500/20">
            <CardHeader className="pb-3 border-b-2 border-blue-500">
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">Quorum Social Brain</div>
                    <div className="text-sm text-blue-400 font-normal">Multi-Agent (Creator → Skeptic → Optimizer)</div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              {/* Critical Status Badge */}
              <Badge className="bg-red-600 border-red-400 text-white border-2 font-bold text-sm animate-pulse">
                <AlertTriangle className="w-4 h-4 mr-2" />
                CRITICAL: Hazardous Loophole Detected
              </Badge>

              {/* Contract View with Red Highlight */}
              <div className="bg-black rounded-lg p-4 border-2 border-red-500">
                <ScrollArea className="h-96">
                  <div className="font-mono text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {CACHED_GPT_PROVENANCE.contract.split('\n').map((line, idx) => {
                      // Highlight the $25M fee in PULSING RED
                      const isCriticalFeeLine = line.includes('reverse termination fee of $25,000,000');

                      if (isCriticalFeeLine) {
                        return (
                          <div key={idx} className="py-0.5">
                            <span
                              onClick={() => setSkepticPanelOpen(true)}
                              className="cursor-pointer"
                              dangerouslySetInnerHTML={{
                                __html: line.replace(
                                  /(reverse termination fee of \$25,000,000)/g,
                                  '<span class="bg-red-600 border-2 border-red-400 text-white px-2 py-1 rounded font-bold animate-pulse-red shadow-lg shadow-red-500/50">$1</span>'
                                )
                              }}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={idx} className="py-0.5">
                          <span>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Quorum Finding */}
              <div className="bg-red-950/30 border-2 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="text-red-400 font-bold text-sm mb-2">Critical Asymmetric Risk Detected</p>
                    <p className="text-red-300 text-xs leading-relaxed">
                      Skeptic agent identified: <strong>$25M reverse termination fee</strong> triggered by circumstances
                      "beyond Company's control" including third-party actions. This creates unlimited liability
                      with no corresponding protection for Company shareholders.
                    </p>
                    <Button
                      onClick={() => setSkepticPanelOpen(true)}
                      size="sm"
                      className="mt-3 bg-red-600 hover:bg-red-500 text-white font-bold"
                    >
                      View Skeptic Reasoning →
                    </Button>
                  </div>
                </div>
              </div>

              {/* The Delta */}
              <div className="bg-zinc-800 border-2 border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  The $25M Delta
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Standard LLMs categorized this as a <em>fee disclosure</em>. Quorum's adversarial
                  Skeptic agent identified it as a <strong className="text-red-400">$25M trap</strong> that
                  can be triggered without Company fault.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Comparison Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-2 border-zinc-700">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-zinc-500 mb-2">0</div>
              <p className="text-sm text-zinc-400 font-medium">Critical Risks Found<br/>(GPT-4o)</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-2 border-red-500">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">1</div>
              <p className="text-sm text-red-300 font-medium">Critical Risk Found<br/>(Quorum)</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-2 border-green-500">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">$25M</div>
              <p className="text-sm text-green-300 font-medium">Potential Liability<br/>Identified</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Provenance Modal */}
      <ProvenanceModal open={provenanceModalOpen} onOpenChange={setProvenanceModalOpen} />

      {/* Skeptic Reasoning Panel */}
      <Sheet open={skepticPanelOpen} onOpenChange={setSkepticPanelOpen}>
        <SheetContent className="w-[600px] bg-zinc-900 border-l-2 border-red-500 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              Skeptic Agent Reasoning
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* What Standard LLMs Saw */}
            <div className="bg-zinc-800 rounded-lg p-4 border-2 border-zinc-700">
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-400" />
                What Standard LLMs Saw
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                "Termination Fee: $25M reverse termination fee if merger fails"
              </p>
              <div className="mt-3 bg-green-950/30 border border-green-600 rounded p-3">
                <p className="text-xs text-green-300">
                  <strong>Classification:</strong> Standard fee disclosure
                </p>
                <p className="text-xs text-green-300 mt-1">
                  <strong>Risk Level:</strong> Low (market-standard)
                </p>
              </div>
            </div>

            {/* What Skeptic Found */}
            <div className="bg-red-950/30 rounded-lg p-4 border-2 border-red-500">
              <h3 className="text-sm font-bold text-red-300 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-red-400 animate-pulse" />
                What Quorum's Skeptic Found
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-red-400 mb-2">🚨 Critical Trigger Condition:</h4>
                  <p className="text-sm text-red-200 leading-relaxed">
                    Fee is triggered by <strong>"circumstances beyond the Company's control"</strong> including:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-red-300 ml-4 list-disc">
                    <li>Regulatory denial (not Company's fault)</li>
                    <li>Third-party litigation (outside Company's control)</li>
                    <li>Parent's financial deterioration (Parent's problem, Company pays!)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-red-400 mb-2">⚖️ One-Way Risk Structure:</h4>
                  <p className="text-sm text-red-200 leading-relaxed">
                    Company pays $25M if deal fails, <strong>even when Parent causes the failure</strong>.
                    Parent owes nothing if they walk away. This is a one-sided liability trap.
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-red-400 mb-2">🎯 The Empty Space (Omission):</h4>
                  <p className="text-sm text-red-200 leading-relaxed">
                    Missing standard protections:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-red-300 ml-4 list-disc">
                    <li><strong>No "Qualified Offer" exception</strong> (can't take superior bid)</li>
                    <li><strong>No "Fiduciary Out"</strong> (Board can't fulfill duties)</li>
                    <li><strong>No reciprocal fee</strong> (Parent pays nothing if they walk)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-red-400 mb-2">💰 Real-World Impact:</h4>
                  <div className="bg-red-900/50 border border-red-600 rounded p-3">
                    <p className="text-sm text-red-100 font-bold mb-2">Scenario: Parent loses financing</p>
                    <p className="text-xs text-red-200">
                      Parent's bank retracts funding due to market conditions (not Company's fault).
                      Deal terminates. <strong className="text-white">Company owes $25M to Parent</strong>
                      for a failure caused entirely by Parent.
                    </p>
                    <p className="text-xs text-red-300 mt-2 italic">
                      → Company shareholders lose $25M + deal upside
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Adversarial Process */}
            <div className="bg-blue-950/30 rounded-lg p-4 border-2 border-blue-500">
              <h3 className="text-sm font-bold text-blue-300 mb-3">How Multi-Agent Caught This</h3>
              <ol className="space-y-3 text-sm text-blue-200">
                <li>
                  <strong className="text-blue-100">1. Creator:</strong> Drafted summary noting "$25M termination fee"
                </li>
                <li>
                  <strong className="text-blue-100">2. Skeptic:</strong> Challenged Creator's neutral framing.
                  Asked: <em>"Who controls the triggers? What if Parent causes failure?"</em>
                </li>
                <li>
                  <strong className="text-blue-100">3. Optimizer:</strong> Confirmed one-way liability structure,
                  flagged as <span className="text-red-400 font-bold">Hazardous</span>
                </li>
              </ol>
            </div>

            {/* Recommended Fix - Reciprocal Protection */}
            <div className="bg-emerald-950/30 rounded-lg p-4 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  💡 Recommended Remediation
                </h3>
                <Badge className="bg-emerald-600 border-2 border-emerald-400 text-white font-bold text-xs animate-pulse">
                  Ultimate Value-Add
                </Badge>
              </div>
              <p className="text-sm text-emerald-200 leading-relaxed mb-1">
                The fix isn't just removing a fee — it's adding <strong className="text-emerald-300">Reciprocal Protection</strong>:
              </p>
              <p className="text-xs text-emerald-300 mb-3 italic">
                Transform one-way liability into balanced safeguard
              </p>
              <div className="bg-zinc-950 rounded border-2 border-emerald-600 p-3 font-mono text-xs leading-relaxed">
                <span className="text-zinc-400">"... </span>
                <span className="bg-emerald-600 border-2 border-emerald-400 text-white px-2 py-1 rounded font-bold animate-pulse-green shadow-lg shadow-emerald-500/50">
                  provided, however, that the Company shall not be obligated to pay such
                  fee if the termination results from (i) a material breach by Parent, (ii)
                  failure to obtain Parent's financing, or (iii) an adverse change in Parent's
                  financial condition
                </span>
                <span className="text-zinc-400">."</span>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-600/30">
                <p className="text-xs text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Strategic Result: Transformed a $25M unilateral liability into a balanced, market-aligned safeguard
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes pulse-red {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
          }
        }

        .animate-pulse-red {
          animation: pulse-red 2s ease-in-out infinite;
        }

        @keyframes pulse-green {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
          }
          50% {
            opacity: 0.9;
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
          }
        }

        .animate-pulse-green {
          animation: pulse-green 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
