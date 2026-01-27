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
  Sparkles,
  Copy,
  Check,
  FileText,
  File,
} from "lucide-react";
import { exportAsPDF, exportAsWord } from "@/lib/exportReport";

// The poison pill contract text (fallback for demo)
const DEMO_CONTRACT_TEXT = `# SHAREHOLDER RIGHTS AGREEMENT

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
function findSectionLines(contractText: string, articleRef: string, clauseRef: string): { start: number; end: number } | null {
  const lines = contractText.split("\n");

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

interface RemediationResult {
  original: string;
  rewritten: string;
  rationale: string;
}

export default function ReportPage() {
  const [contractText, setContractText] = useState(DEMO_CONTRACT_TEXT);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [optimizerData, setOptimizerData] = useState<OptimizerOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<{ start: number; end: number } | null>(null);
  const [activeCardIdx, setActiveCardIdx] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [remediationLoading, setRemediationLoading] = useState<string | null>(null);
  const [remediationResults, setRemediationResults] = useState<Map<string, RemediationResult>>(new Map());
  const [copiedClause, setCopiedClause] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [dealName, setDealName] = useState("Untitled Deal");
  const [exportFormat, setExportFormat] = useState<"pdf" | "word" | null>(null);

  // Load contract from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("quorum-contract");
    if (stored) {
      setContractText(stored);
    }
  }, []);

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
    const range = findSectionLines(contractText, article, clause);
    if (!range) return;

    setHighlightedLines(range);
    setActiveCardIdx(cardId);

    const lineEl = lineRefs.current.get(range.start);
    if (lineEl) {
      lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [contractText]);

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
        body: contractText,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);

      try {
        const parsed = JSON.parse(data.final_output);
        setOptimizerData(parsed);
      } catch {
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

  const handleRemediate = async (cardId: string, article: string, clause: string, riskSummary: string) => {
    setRemediationLoading(cardId);

    try {
      // Extract clause text from contract
      const range = findSectionLines(contractText, article, clause);
      if (!range) {
        throw new Error("Could not find clause text in contract");
      }

      const lines = contractText.split("\n");
      const clauseText = lines.slice(range.start, range.end + 1).join("\n");

      const response = await fetch("http://localhost:8000/remediate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clause_text: clauseText,
          risk_description: riskSummary,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result: RemediationResult = await response.json();

      setRemediationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(cardId, result);
        return newMap;
      });
    } catch (err) {
      console.error("Remediation error:", err);
      setError(err instanceof Error ? err.message : "Remediation failed");
    } finally {
      setRemediationLoading(null);
    }
  };

  const handleCopyToClipboard = async (text: string, cardId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedClause(cardId);
      setTimeout(() => setCopiedClause(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExport = (format: "pdf" | "word") => {
    setExportFormat(format);
    setExportDialogOpen(true);
  };

  const confirmExport = () => {
    if (!optimizerData || !exportFormat) return;

    const debateTranscript = buildDebateTranscript(analysisResult);

    if (exportFormat === "pdf") {
      exportAsPDF(dealName, optimizerData, remediationResults, debateTranscript);
    } else {
      exportAsWord(dealName, optimizerData, remediationResults, debateTranscript);
    }

    setExportDialogOpen(false);
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
        return <Badge className="bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 shadow-lg shadow-red-500/40 font-bold px-3 py-1">{status}</Badge>;
      case "Warning":
        return <Badge className="bg-orange-600 hover:bg-orange-500 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/40 font-bold px-3 py-1">{status}</Badge>;
      default:
        return <Badge className="bg-green-600 hover:bg-green-500 text-white border-2 border-green-400 shadow-lg shadow-green-500/40 font-bold px-3 py-1">{status}</Badge>;
    }
  };

  const getHighlightClass = (lineIdx: number, status?: string) => {
    if (!highlightedLines) return "";
    if (lineIdx >= highlightedLines.start && lineIdx <= highlightedLines.end) {
      if (status === "Hazardous") return "bg-red-950/60 border-l-4 border-l-red-500 shadow-inner shadow-red-500/30";
      if (status === "Warning") return "bg-orange-950/60 border-l-4 border-l-orange-500 shadow-inner shadow-orange-500/30";
      return "bg-yellow-950/60 border-l-4 border-l-yellow-500 shadow-inner shadow-yellow-500/30";
    }
    return "";
  };

  const activeStatus = activeCardIdx && optimizerData
    ? optimizerData.article_breakdown.find((_, idx) => `article-${idx}` === activeCardIdx)?.status
    : undefined;

  const contractLines = contractText.split("\n");

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black print:bg-white">
      {/* Left Panel - The Evidence */}
      <div className="w-full lg:w-1/2 border-r border-zinc-700 flex flex-col print:w-full">
        <div className="p-4 sm:p-6 border-b-2 border-zinc-700 bg-zinc-900 print:bg-white print:border-zinc-300">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 print:text-black">
            <FileSearch className="w-6 h-6" />
            The Evidence
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 mt-2 print:text-zinc-600 font-medium">Contract under review</p>
        </div>
        <div ref={evidencePanelRef} className="flex-1 overflow-y-auto bg-black">
          <div className="font-mono text-sm sm:text-base leading-relaxed">
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
                <span className="select-none text-zinc-500 text-right w-10 sm:w-12 shrink-0 pr-3 py-1 border-r-2 border-zinc-800 print:text-zinc-400 print:border-zinc-200 font-bold">
                  {idx + 1}
                </span>
                <span
                  className={`pl-4 py-1 flex-1 whitespace-pre-wrap print:text-black ${
                    line.startsWith("## ")
                      ? "text-white font-bold"
                      : line.startsWith("**")
                      ? "text-zinc-200 font-semibold"
                      : "text-zinc-300"
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
      <div className="w-full lg:w-1/2 flex flex-col bg-zinc-900 print:w-full print:bg-white">
        <div className="p-4 sm:p-6 border-b-2 border-zinc-700 print:border-zinc-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3 print:text-black">
                <Shield className="w-6 h-6" />
                The Verdict
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 mt-2 print:text-zinc-600 font-medium">AI Risk Assessment Dashboard</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {analysisResult && (
                <Button
                  onClick={() => setSheetOpen(true)}
                  variant="outline"
                  className="border-2 border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 font-semibold"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">View Debate</span>
                </Button>
              )}
              {optimizerData && (
                <>
                  <Button
                    onClick={() => handleExport("pdf")}
                    variant="outline"
                    className="border-2 border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 font-semibold"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                  </Button>
                  <Button
                    onClick={() => handleExport("word")}
                    variant="outline"
                    className="border-2 border-zinc-600 text-white hover:bg-zinc-800 hover:border-zinc-500 font-semibold"
                  >
                    <File className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export Word</span>
                  </Button>
                </>
              )}
              <Button
                onClick={handleScanForRisks}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-500 text-white border-2 border-red-500 shadow-lg shadow-red-500/30 font-bold"
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
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Shield className="w-20 h-20 mb-6 opacity-70 text-zinc-500" />
              <p className="text-xl font-bold text-white">Click &quot;Scan for Risks&quot; to analyze the contract</p>
              <p className="text-base mt-3 text-zinc-300">The Social Brain will review this document</p>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-300">
              <Loader2 className="w-16 h-16 animate-spin mb-6 text-red-500" />
              <p className="text-2xl font-bold text-white">Social Brain Analyzing...</p>
              <p className="text-base mt-3 text-zinc-300 font-medium">Creator → Skeptic → Optimizer</p>
            </div>
          )}

          {optimizerData && (
            <div className="space-y-6">
              {/* Adversarial Intensity */}
              <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-2xl print:bg-white print:border-zinc-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between print:text-black text-xl">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">Adversarial Intensity</span>
                      <div className="relative">
                        <button
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          className="text-zinc-400 hover:text-white transition-colors"
                        >
                          <Info className="w-5 h-5" />
                        </button>
                        {showTooltip && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-80 p-4 text-sm font-normal text-zinc-200 bg-black border-2 border-zinc-600 rounded-lg shadow-2xl">
                            Calculated based on the intensity of disagreement between the Creator (Draft) and the Skeptic (Audit).
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black border-l-2 border-t-2 border-zinc-600 rotate-45" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={`${
                        optimizerData.conflict_analysis.risk_level === "Critical"
                          ? "bg-red-600 border-red-400 shadow-lg shadow-red-500/50"
                          : optimizerData.conflict_analysis.risk_level === "High"
                          ? "bg-red-500 border-red-400 shadow-lg shadow-red-500/40"
                          : optimizerData.conflict_analysis.risk_level === "Medium"
                          ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/40"
                          : "bg-green-500 border-green-400 shadow-lg shadow-green-500/40"
                      } text-white border-2 font-bold px-4 py-1.5 text-base`}
                    >
                      {optimizerData.conflict_analysis.risk_level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-5xl font-bold text-white print:text-black">
                        {optimizerData.conflict_analysis.score}
                      </span>
                      <span className="text-zinc-300 text-2xl font-semibold">/100</span>
                    </div>
                    <div className="relative mt-4">
                      <Progress
                        value={optimizerData.conflict_analysis.score}
                        className={`h-4 ${getScoreIndicatorColor(optimizerData.conflict_analysis.score)}`}
                      />
                      <div
                        className="absolute top-0 h-4 w-1 bg-zinc-300 shadow-md"
                        style={{ left: "40%" }}
                      />
                      <div
                        className="absolute top-5 text-xs text-zinc-400 -translate-x-1/2 whitespace-nowrap font-bold"
                        style={{ left: "40%" }}
                      >
                        Market Standard
                      </div>
                    </div>
                    <p className="text-base text-zinc-200 mt-6 print:text-zinc-600">
                      <strong className="text-white">Deal-Breaker Risk:</strong> {optimizerData.conflict_analysis.primary_threat}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skeptic's Key Catch */}
              <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-2xl print:bg-white print:border-zinc-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg font-bold print:text-black">Key Insight from Skeptic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-100 text-base italic print:text-zinc-700 font-medium">
                    &ldquo;{optimizerData.skeptic_validation.key_catch}&rdquo;
                  </p>
                </CardContent>
              </Card>

              {/* Critical Omissions */}
              {optimizerData.critical_omissions.length > 0 && (
                <Card className="bg-red-950/30 border-4 border-dashed border-red-500 shadow-2xl shadow-red-500/20 print:bg-red-50 print:border-red-400">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-400 flex items-center gap-3 text-lg print:text-red-700">
                      <FileWarning className="w-6 h-6" />
                      <span className="font-bold">Missing Safeguards</span>
                      <span className="text-sm font-bold text-red-400 ml-2">(Critical Omissions)</span>
                    </CardTitle>
                    <p className="text-sm text-red-300 mt-2 font-medium">
                      These protections are absent from the contract and should be added.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optimizerData.critical_omissions.map((omission, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-red-950/50 rounded-lg border-2 border-dashed border-red-600 print:bg-red-100 print:border-red-300 shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-red-300 flex items-center gap-2 text-base print:text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            {omission.missing_provision}
                          </span>
                          <Badge
                            className={`${
                              omission.severity === "Critical"
                                ? "bg-red-600 border-red-400 shadow-lg shadow-red-500/50"
                                : "bg-orange-600 border-orange-400 shadow-lg shadow-orange-500/50"
                            } text-white text-sm border-2 font-bold px-3 py-1`}
                          >
                            {omission.severity}
                          </Badge>
                        </div>
                        <p className="text-base text-red-200 print:text-red-700 font-medium">{omission.impact}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Article Breakdown */}
              <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-2xl print:bg-white print:border-zinc-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-3 text-lg print:text-black">
                    <ShieldAlert className="w-6 h-6" />
                    <span className="font-bold">Clause Risk Assessment</span>
                    <span className="text-sm font-bold text-zinc-400 ml-2">(Present in Contract)</span>
                  </CardTitle>
                  <p className="text-sm text-zinc-300 mt-2 font-medium">
                    Click a clause to navigate to it in the contract.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {optimizerData.article_breakdown.map((item, idx) => {
                    const cardId = `article-${idx}`;
                    const isActive = activeCardIdx === cardId;
                    const remediation = remediationResults.get(cardId);
                    const isRemediating = remediationLoading === cardId;
                    const isHazardous = item.status === "Hazardous" || item.status === "Critical";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 shadow-lg ${
                          isActive
                            ? item.status === "Hazardous"
                              ? "bg-red-950/60 border-red-500 ring-2 ring-red-500/60 shadow-red-500/40"
                              : item.status === "Warning"
                              ? "bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/60 shadow-orange-500/40"
                              : "bg-green-950/60 border-green-500 ring-2 ring-green-500/60 shadow-green-500/40"
                            : "bg-zinc-900 border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800 hover:shadow-xl"
                        } print:bg-white print:border-zinc-300`}
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => scrollToSection(item.article, item.clause, cardId)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-white text-base print:text-black">
                              {item.article} - {item.clause}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-base text-zinc-200 print:text-zinc-600 leading-relaxed">{item.risk_summary}</p>
                        </div>

                        {/* Suggest Fix Button for Hazardous clauses */}
                        {isHazardous && !remediation && (
                          <div className="mt-4 pt-4 border-t border-zinc-700">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemediate(cardId, item.article, item.clause, item.risk_summary);
                              }}
                              disabled={isRemediating}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/30"
                            >
                              {isRemediating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Drafting remedy...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  Suggest Fix
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Remediation Diff View */}
                        {remediation && (
                          <div className="mt-4 pt-4 border-t border-zinc-700 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Suggested Remediation
                              </h4>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyToClipboard(remediation.rewritten, cardId);
                                }}
                                variant="outline"
                                size="sm"
                                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                              >
                                {copiedClause === cardId ? (
                                  <>
                                    <Check className="mr-2 h-3 w-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="mr-2 h-3 w-3" />
                                    Copy Fix
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Diff View */}
                            <div className="space-y-3">
                              {/* Original Clause */}
                              <div className="bg-red-950/30 border-2 border-red-700/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                                  Original (Hazardous)
                                </p>
                                <pre className="text-sm text-red-200 whitespace-pre-wrap font-mono leading-relaxed line-through decoration-red-500 decoration-2">
                                  {remediation.original}
                                </pre>
                              </div>

                              {/* Proposed Fix */}
                              <div className="bg-green-950/30 border-2 border-green-700/50 rounded-lg p-3">
                                <p className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                                  Proposed Fix (Safer)
                                </p>
                                <pre className="text-sm text-green-200 whitespace-pre-wrap font-mono leading-relaxed">
                                  {remediation.rewritten}
                                </pre>
                              </div>

                              {/* Rationale */}
                              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                                <p className="text-xs font-bold text-zinc-400 mb-2">Rationale</p>
                                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                  {remediation.rationale}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Full Skeptic Critique */}
              {analysisResult && (
                <Card className="bg-zinc-800 border-2 border-zinc-700 shadow-2xl print:bg-white print:border-zinc-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg font-bold print:text-black">Full Skeptic Critique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 print:h-auto">
                      <pre className="text-base text-zinc-100 whitespace-pre-wrap print:text-black leading-relaxed">
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
        <SheetContent className="w-[480px] sm:w-[540px] bg-zinc-900 border-l-2 border-zinc-700 overflow-hidden flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle className="text-white flex items-center gap-3 text-xl font-bold">
              <MessageSquare className="w-6 h-6" />
              Debate Transcript
            </SheetTitle>
            <SheetDescription className="text-zinc-300 text-base font-medium">
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
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-3 h-3 rounded-full ${config.dotColor} mt-2 shadow-lg`} />
                      {idx < debateTranscript.length - 1 && (
                        <div className="w-0.5 flex-1 bg-zinc-700 mt-2" />
                      )}
                    </div>
                    <div className={`flex-1 p-4 rounded-lg border-2 ${config.bgColor} mb-0 shadow-md`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-base font-bold flex items-center gap-2 ${config.color}`}>
                          {config.icon}
                          {msg.label}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono font-semibold">{msg.timestamp}</span>
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Export Dialog */}
      {exportDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <Card className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Red Flag Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-bold text-zinc-300 mb-2 block">
                  Deal Name
                </label>
                <input
                  type="text"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="Enter deal name..."
                  className="w-full px-4 py-2 bg-zinc-800 border-2 border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400 mb-2">
                  <strong className="text-zinc-300">Format:</strong> {exportFormat === "pdf" ? "PDF (immutable)" : "Word (editable)"}
                </p>
                <p className="text-xs text-zinc-400">
                  Report will include: Executive Summary, Critical Risks{" "}
                  {remediationResults.size > 0 && "(with remediation suggestions)"}, and Full Analysis.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setExportDialogOpen(false)}
                  variant="outline"
                  className="flex-1 border-2 border-zinc-600 text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmExport}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-lg"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
