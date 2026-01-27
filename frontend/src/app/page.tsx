"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertTriangle,
  Shield,
  FileSearch,
  Loader2,
  Info,
  Download,
  ShieldAlert,
  FileWarning,
  MessageSquare,
  Bot,
  Eye,
  Scale,
} from "lucide-react";

// The poison pill contract text
const CONTRACT_TEXT = `# SHAREHOLDER RIGHTS AGREEMENT

**Effective Date:** January 15, 2024

**Parties:**
- ACME Corporation ("Company")
- Rights Agent: Delaware Trust Company

## ARTICLE I - DEFINITIONS

**Section 1.1 - Acquiring Person**
"Acquiring Person" shall mean any Person who becomes the Beneficial Owner of 15% or more of the outstanding Common Shares.

**Section 1.2 - Adverse Person**
"Adverse Person" shall mean any Person declared as such by the Board of Directors in their sole discretion.

**Section 1.3 - Flip-In Event**
A "Flip-In Event" shall occur when any Person becomes an Acquiring Person.

## ARTICLE II - THE RIGHTS

**Section 2.1 - Grant of Rights**
The Board hereby grants one Right for each outstanding Common Share. Each Right entitles the holder to purchase one Common Share at the Exercise Price of $150.00.

**Section 2.2 - Flip-In Provision**
Upon the occurrence of a Flip-In Event:
(a) Each Right (except those held by the Acquiring Person) shall become exercisable;
(b) Each Right holder (except the Acquiring Person) may purchase Common Shares at 50% of the current market price;
(c) The Acquiring Person's Rights shall become null and void.

**Section 2.3 - Flip-Over Provision**
In the event of a merger or acquisition where the Company is not the surviving entity:
(a) Each Right shall entitle the holder to purchase shares of the acquiring company;
(b) The purchase price shall be 50% of the market value of such shares.

## ARTICLE III - REDEMPTION

**Section 3.1 - Redemption by the Board**
The Board may, at its sole discretion, redeem all Rights at a price of $0.01 per Right at any time prior to a Flip-In Event.

**Section 3.2 - Redemption Conditions**
Redemption requires approval by a majority of the Independent Directors.

## ARTICLE IV - EXCHANGE

**Section 4.1 - Exchange Option**
After a Flip-In Event, the Board may exchange each Right for one Common Share.

## ARTICLE V - ANTI-DILUTION

**Section 5.1 - Adjustment of Exercise Price**
The Exercise Price and number of shares purchasable shall be adjusted for stock splits, dividends, and similar events.

## ARTICLE VI - DURATION

**Section 6.1 - Expiration**
The Rights shall expire on January 15, 2034, unless earlier redeemed or exchanged.

**Section 6.2 - Early Termination**
The Rights may be terminated earlier upon:
(a) Redemption by the Board;
(b) Exchange pursuant to Section 4.1;
(c) Consummation of a merger approved by the Board.

## ARTICLE VII - MISCELLANEOUS

**Section 7.1 - Governing Law**
This Agreement shall be governed by the laws of the State of Delaware.

**Section 7.2 - Amendments**
This Agreement may be amended by the Board without shareholder approval prior to a Flip-In Event.

**Section 7.3 - Severability**
If any provision is held invalid, the remaining provisions shall continue in full force.

---

**IN WITNESS WHEREOF**, the parties have executed this Agreement as of the date first written above.

ACME Corporation
By: _______________________
Name: John Smith
Title: Chief Executive Officer

Delaware Trust Company
By: _______________________
Name: Jane Doe
Title: Vice President`;

// Map article references to search terms for finding them in the contract
const ARTICLE_SEARCH_MAP: Record<string, string> = {
  "Article I": "## ARTICLE I",
  "Article II": "## ARTICLE II",
  "Article III": "## ARTICLE III",
  "Article IV": "## ARTICLE IV",
  "Article V": "## ARTICLE V",
  "Article VI": "## ARTICLE VI",
  "Article VII": "## ARTICLE VII",
};

// Find the line range for a given article/section in the contract
function findSectionLines(articleRef: string, clauseRef: string): { start: number; end: number } | null {
  const lines = CONTRACT_TEXT.split("\n");

  // Try to match a specific section first (e.g., "Section 1.2")
  const sectionMatch = clauseRef.match(/Section\s+([\d.]+)/);
  if (sectionMatch) {
    const sectionNum = sectionMatch[1];
    const sectionPattern = `**Section ${sectionNum}`;
    let startIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(sectionPattern)) {
        startIdx = i;
        break;
      }
    }

    if (startIdx !== -1) {
      // Find the end: next section header, article header, or separator
      let endIdx = startIdx + 1;
      while (endIdx < lines.length) {
        const line = lines[endIdx];
        if (line.startsWith("**Section") || line.startsWith("## ARTICLE") || line === "---") {
          break;
        }
        endIdx++;
      }
      return { start: startIdx, end: endIdx - 1 };
    }
  }

  // Fall back to article-level match
  const searchTerm = ARTICLE_SEARCH_MAP[articleRef];
  if (searchTerm) {
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchTerm)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) {
      // Find end at next article or separator
      let endIdx = startIdx + 1;
      while (endIdx < lines.length) {
        const line = lines[endIdx];
        if (line.startsWith("## ARTICLE") || line === "---") {
          break;
        }
        endIdx++;
      }
      return { start: startIdx, end: endIdx - 1 };
    }
  }

  return null;
}

interface ArticleBreakdown {
  article: string;
  clause: string;
  status: "Safe" | "Warning" | "Hazardous";
  risk_summary: string;
}

interface CriticalOmission {
  missing_provision: string;
  impact: string;
  severity: "High" | "Critical";
}

interface AnalysisResult {
  creator_summary: string;
  skeptic_critique: string;
  final_output: string;
  messages?: { role: string; content: string }[];
}

interface DebateMessage {
  agent: "creator" | "skeptic" | "optimizer" | "system";
  label: string;
  message: string;
  timestamp: string;
}

function buildDebateTranscript(result: AnalysisResult | null): DebateMessage[] {
  if (!result) return [];

  const messages: DebateMessage[] = [
    {
      agent: "system",
      label: "System",
      message: "Document received. Initiating Social Brain analysis pipeline...",
      timestamp: "T+0s",
    },
    {
      agent: "creator",
      label: "The Creator",
      message: "Analyzing contract structure. Identified 7 articles spanning Definitions, Rights, Redemption, Exchange, Anti-Dilution, Duration, and Miscellaneous provisions.",
      timestamp: "T+2s",
    },
    {
      agent: "creator",
      label: "The Creator",
      message: result.creator_summary
        ? `Draft summary complete. Extracted ${(result.creator_summary.match(/Section/g) || []).length} section references. Key finding: Board retains significant discretionary powers across Redemption (Section 3.1), Amendment (Section 7.2), and Adverse Person designation (Section 1.2).`
        : "Drafting summary of the contract...",
      timestamp: "T+5s",
    },
    {
      agent: "system",
      label: "System",
      message: "Creator draft forwarded to Skeptic for adversarial review.",
      timestamp: "T+6s",
    },
    {
      agent: "skeptic",
      label: "The Skeptic",
      message: "Received the Creator's draft. Beginning adversarial audit. I'm looking at Change of Control, Indemnity, and Termination risks first.",
      timestamp: "T+8s",
    },
    {
      agent: "skeptic",
      label: "The Skeptic",
      message: "CRITICAL FINDING: Section 1.2 — The 'Adverse Person' definition grants the Board unchecked, subjective power. This is a poison pill within a poison pill. Flagging as Hazardous.",
      timestamp: "T+15s",
    },
    {
      agent: "skeptic",
      label: "The Skeptic",
      message: "Section 2.2 — The Flip-In Provision triggers automatic dilution at 15%. This threshold is antiquated. A hostile party can accumulate 14.9% and launch a proxy fight without triggering defenses. This is a 'Death Spiral' vulnerability.",
      timestamp: "T+22s",
    },
    {
      agent: "skeptic",
      label: "The Skeptic",
      message: "Section 7.2 — Unilateral Amendment Power is a fatal flaw. Board can rewrite the agreement without shareholder consent. Combined with Section 3.1 redemption at $0.01, the entire Rights plan is a paper tiger.",
      timestamp: "T+30s",
    },
    {
      agent: "skeptic",
      label: "The Skeptic",
      message: "OMISSION ALERT: No Fiduciary Duty carve-out. No TIDE provision. No Qualified Offer clause. No Fiduciary Out. These are standard modern protections — their absence is itself a critical risk.",
      timestamp: "T+38s",
    },
    {
      agent: "system",
      label: "System",
      message: "Skeptic critique complete. Forwarding draft + critique to Optimizer for final synthesis.",
      timestamp: "T+40s",
    },
    {
      agent: "optimizer",
      label: "The Optimizer",
      message: "Reviewing Creator draft against Skeptic findings. The Skeptic's 'Adverse Person' catch is valid — this grants near-dictatorial Board power. Accepting as Hazardous.",
      timestamp: "T+43s",
    },
    {
      agent: "optimizer",
      label: "The Optimizer",
      message: "The Skeptic's 'Death Spiral' flag on the Flip-In threshold is valid but overstated. Reclassifying from Hazardous to Warning. The 15% threshold is outdated but not immediately exploitable.",
      timestamp: "T+48s",
    },
    {
      agent: "optimizer",
      label: "The Optimizer",
      message: "Missing safeguards confirmed: Fiduciary Duty Carve-Out (Critical), Rights Agent Liability Limitation (High). These are genuine omissions, not nitpicking.",
      timestamp: "T+52s",
    },
    {
      agent: "optimizer",
      label: "The Optimizer",
      message: "Final assessment: Adversarial Intensity Score = 85/100 (High). 4 Hazardous clauses, 4 Warnings, 2 Critical Omissions. Outputting structured JSON risk assessment.",
      timestamp: "T+55s",
    },
    {
      agent: "system",
      label: "System",
      message: "Analysis pipeline complete. Results delivered to dashboard.",
      timestamp: "T+58s",
    },
  ];

  return messages;
}

interface OptimizerOutput {
  conflict_analysis: {
    score: number;
    risk_level: string;
    primary_threat: string;
  };
  article_breakdown: ArticleBreakdown[];
  critical_omissions: CriticalOmission[];
  skeptic_validation: {
    key_catch: string;
    coherence_check: boolean;
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizerData, setOptimizerData] = useState<OptimizerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<{ start: number; end: number } | null>(null);
  const [activeCardIdx, setActiveCardIdx] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debateTranscript = buildDebateTranscript(analysisResult);

  const evidencePanelRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Clear highlight after a delay
  useEffect(() => {
    if (highlightedLines) {
      const timer = setTimeout(() => {
        setHighlightedLines(null);
        setActiveCardIdx(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedLines]);

  const scrollToSection = useCallback((article: string, clause: string, cardId: string) => {
    const range = findSectionLines(article, clause);
    if (!range) return;

    setHighlightedLines(range);
    setActiveCardIdx(cardId);

    // Scroll the line into view
    const lineEl = lineRefs.current.get(range.start);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleScanForRisks = async () => {
    setIsLoading(true);
    setError(null);
    setHighlightedLines(null);
    setActiveCardIdx(null);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: CONTRACT_TEXT,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);

      // Parse the optimizer's JSON output
      try {
        const parsed = JSON.parse(data.final_output);
        setOptimizerData(parsed);
      } catch {
        // If it's wrapped in markdown code blocks, extract it
        const jsonMatch = data.final_output.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          setOptimizerData(JSON.parse(jsonMatch[1]));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMemo = () => {
    window.print();
  };

  const getScoreIndicatorColor = (score: number) => {
    if (score >= 75) return "[&>div]:bg-red-500";
    if (score >= 50) return "[&>div]:bg-orange-500";
    if (score >= 25) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-green-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hazardous":
        return <Badge variant="destructive">{status}</Badge>;
      case "Warning":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">{status}</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">{status}</Badge>;
    }
  };

  const getHighlightClass = (lineIdx: number, status?: string) => {
    if (!highlightedLines) return "";
    if (lineIdx >= highlightedLines.start && lineIdx <= highlightedLines.end) {
      if (status === "Hazardous") return "bg-red-500/20 border-l-2 border-l-red-500";
      if (status === "Warning") return "bg-yellow-500/15 border-l-2 border-l-yellow-500";
      return "bg-yellow-500/20 border-l-2 border-l-yellow-400";
    }
    return "";
  };

  // Determine highlight color based on active card status
  const activeStatus = activeCardIdx && optimizerData
    ? optimizerData.article_breakdown.find((_, idx) => `article-${idx}` === activeCardIdx)?.status
    : undefined;

  const contractLines = CONTRACT_TEXT.split("\n");

  return (
    <div className="flex h-screen bg-zinc-950 print:bg-white">
      {/* Left Panel - The Evidence */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col print:w-full">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 print:bg-white print:border-zinc-300">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 print:text-black">
            <FileSearch className="w-5 h-5" />
            The Evidence
          </h2>
          <p className="text-sm text-zinc-400 mt-1 print:text-zinc-600">Contract under review</p>
        </div>
        <div ref={evidencePanelRef} className="flex-1 overflow-y-auto">
          <div className="font-mono text-sm leading-relaxed">
            {contractLines.map((line, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  if (el) lineRefs.current.set(idx, el);
                }}
                className={`flex transition-colors duration-300 ${getHighlightClass(idx, activeStatus)} ${
                  highlightedLines &&
                  idx >= highlightedLines.start &&
                  idx <= highlightedLines.end
                    ? "transition-none"
                    : ""
                }`}
              >
                <span className="select-none text-zinc-600 text-right w-10 shrink-0 pr-3 py-0.5 border-r border-zinc-800 print:text-zinc-400 print:border-zinc-200">
                  {idx + 1}
                </span>
                <span
                  className={`pl-3 py-0.5 flex-1 whitespace-pre-wrap print:text-black ${
                    line.startsWith("## ")
                      ? "text-zinc-100 font-bold"
                      : line.startsWith("**")
                      ? "text-zinc-200"
                      : "text-zinc-400"
                  }`}
                >
                  {line || "\u00A0"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - The Verdict */}
      <div className="w-1/2 flex flex-col bg-zinc-900 print:w-full print:bg-white">
        <div className="p-4 border-b border-zinc-800 print:border-zinc-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2 print:text-black">
                <Shield className="w-5 h-5" />
                The Verdict
              </h2>
              <p className="text-sm text-zinc-400 mt-1 print:text-zinc-600">AI Risk Assessment Dashboard</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              {analysisResult && (
                <Button
                  onClick={() => setSheetOpen(true)}
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Debate Transcript
                </Button>
              )}
              {optimizerData && (
                <Button
                  onClick={handleExportMemo}
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Risk Memo
                </Button>
              )}
              <Button
                onClick={handleScanForRisks}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Scan for Risks
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!analysisResult && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <Shield className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Click &quot;Scan for Risks&quot; to analyze the contract</p>
              <p className="text-sm mt-2">The Social Brain will review this document</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="text-lg">Social Brain Analyzing...</p>
              <p className="text-sm mt-2">Creator → Skeptic → Optimizer</p>
            </div>
          )}

          {optimizerData && (
            <div className="space-y-4">
              {/* Adversarial Intensity */}
              <Card className="bg-zinc-800 border-zinc-700 print:bg-white print:border-zinc-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 flex items-center justify-between print:text-black">
                    <div className="flex items-center gap-2">
                      <span>Adversarial Intensity</span>
                      <div className="relative">
                        <button
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {showTooltip && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-7 z-50 w-72 p-3 text-xs font-normal text-zinc-200 bg-zinc-950 border border-zinc-700 rounded-lg shadow-xl">
                            Calculated based on the intensity of disagreement between the Creator (Draft) and the Skeptic (Audit).
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-l border-t border-zinc-700 rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={`${
                        optimizerData.conflict_analysis.risk_level === "Critical"
                          ? "bg-red-600"
                          : optimizerData.conflict_analysis.risk_level === "High"
                          ? "bg-red-500"
                          : optimizerData.conflict_analysis.risk_level === "Medium"
                          ? "bg-orange-500"
                          : "bg-green-500"
                      } text-white`}
                    >
                      {optimizerData.conflict_analysis.risk_level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold text-zinc-100 print:text-black">
                        {optimizerData.conflict_analysis.score}
                      </span>
                      <span className="text-zinc-400">/100</span>
                    </div>
                    {/* Progress bar with Market Standard marker */}
                    <div className="relative">
                      <Progress
                        value={optimizerData.conflict_analysis.score}
                        className={`h-3 ${getScoreIndicatorColor(optimizerData.conflict_analysis.score)}`}
                      />
                      {/* Market Standard marker at 40% */}
                      <div
                        className="absolute top-0 h-3 w-0.5 bg-zinc-400"
                        style={{ left: "40%" }}
                      />
                      <div
                        className="absolute top-4 text-[10px] text-zinc-500 -translate-x-1/2 whitespace-nowrap"
                        style={{ left: "40%" }}
                      >
                        Market Standard
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mt-5 print:text-zinc-600">
                      <strong>Primary Threat:</strong> {optimizerData.conflict_analysis.primary_threat}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skeptic's Key Catch */}
              <Card className="bg-zinc-800 border-zinc-700 print:bg-white print:border-zinc-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 text-base print:text-black">Key Insight from Skeptic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 text-sm italic print:text-zinc-700">
                    &ldquo;{optimizerData.skeptic_validation.key_catch}&rdquo;
                  </p>
                </CardContent>
              </Card>

              {/* Critical Omissions - MISSING safeguards (dashed red border) */}
              {optimizerData.critical_omissions.length > 0 && (
                <Card className="bg-zinc-800/50 border-2 border-dashed border-red-700 print:bg-red-50 print:border-red-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-400 flex items-center gap-2 print:text-red-700">
                      <FileWarning className="w-5 h-5" />
                      Missing Safeguards
                      <span className="text-xs font-normal text-red-500 ml-2">(Critical Omissions)</span>
                    </CardTitle>
                    <p className="text-xs text-red-500/70 mt-1">
                      These protections are absent from the contract and should be added.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optimizerData.critical_omissions.map((omission, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-red-950/40 rounded-lg border border-dashed border-red-800 print:bg-red-100 print:border-red-300"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-300 flex items-center gap-1.5 print:text-red-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {omission.missing_provision}
                          </span>
                          <Badge
                            className={`${
                              omission.severity === "Critical"
                                ? "bg-red-600"
                                : "bg-orange-600"
                            } text-white text-[10px]`}
                          >
                            {omission.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-red-200/80 print:text-red-700">{omission.impact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Article Breakdown - PRESENT clauses (clickable) */}
              <Card className="bg-zinc-800 border-zinc-700 print:bg-white print:border-zinc-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 flex items-center gap-2 print:text-black">
                    <ShieldAlert className="w-5 h-5" />
                    Clause Risk Assessment
                    <span className="text-xs font-normal text-zinc-500 ml-2">(Present in Contract)</span>
                  </CardTitle>
                  <p className="text-xs text-zinc-500 mt-1">
                    Click a clause to navigate to it in the contract.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {optimizerData.article_breakdown.map((item, idx) => {
                    const cardId = `article-${idx}`;
                    const isActive = activeCardIdx === cardId;
                    return (
                      <div
                        key={idx}
                        onClick={() => scrollToSection(item.article, item.clause, cardId)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isActive
                            ? item.status === "Hazardous"
                              ? "bg-red-950/50 border-red-600 ring-1 ring-red-500/50"
                              : item.status === "Warning"
                              ? "bg-yellow-950/30 border-yellow-600 ring-1 ring-yellow-500/50"
                              : "bg-green-950/30 border-green-600 ring-1 ring-green-500/50"
                            : "bg-zinc-900 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/80"
                        } print:bg-white print:border-zinc-300 print:cursor-default`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-zinc-200 print:text-black">
                            {item.article} - {item.clause}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-zinc-400 print:text-zinc-600">{item.risk_summary}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Full Skeptic Critique */}
              {analysisResult && (
                <Card className="bg-zinc-800 border-zinc-700 print:bg-white print:border-zinc-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-zinc-100 print:text-black">Full Skeptic Critique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 print:h-auto">
                      <pre className="text-sm text-zinc-300 whitespace-pre-wrap print:text-black">
                        {analysisResult.skeptic_critique}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Thinking Process Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[480px] sm:w-[540px] bg-zinc-900 border-zinc-700 overflow-hidden flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-zinc-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Debate Transcript
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              The internal reasoning process between Creator, Skeptic, and Optimizer agents.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="space-y-4 pb-4">
              {debateTranscript.map((msg, idx) => {
                const agentConfig = {
                  creator: {
                    icon: <Eye className="w-4 h-4" />,
                    color: "text-blue-400",
                    bgColor: "bg-blue-950/30 border-blue-800/50",
                    dotColor: "bg-blue-400",
                  },
                  skeptic: {
                    icon: <AlertTriangle className="w-4 h-4" />,
                    color: "text-red-400",
                    bgColor: "bg-red-950/30 border-red-800/50",
                    dotColor: "bg-red-400",
                  },
                  optimizer: {
                    icon: <Scale className="w-4 h-4" />,
                    color: "text-emerald-400",
                    bgColor: "bg-emerald-950/30 border-emerald-800/50",
                    dotColor: "bg-emerald-400",
                  },
                  system: {
                    icon: <Bot className="w-4 h-4" />,
                    color: "text-zinc-500",
                    bgColor: "bg-zinc-800/50 border-zinc-700/50",
                    dotColor: "bg-zinc-500",
                  },
                };

                const config = agentConfig[msg.agent];

                return (
                  <div key={idx} className="flex gap-3">
                    {/* Timeline */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor} mt-1.5`} />
                      {idx < debateTranscript.length - 1 && (
                        <div className="w-px flex-1 bg-zinc-700 mt-1" />
                      )}
                    </div>
                    {/* Message */}
                    <div className={`flex-1 p-3 rounded-lg border ${config.bgColor} mb-0`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${config.color}`}>
                          {config.icon}
                          {msg.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
