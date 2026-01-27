"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Shield,
  FileSearch,
  Loader2,
  Info,
  Download,
  ShieldAlert,
  FileWarning,
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

  const handleScanForRisks = async () => {
    setIsLoading(true);
    setError(null);

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

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 25) return "bg-yellow-500";
    return "bg-green-500";
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
        <ScrollArea className="flex-1 p-4">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed print:text-black">
            {CONTRACT_TEXT}
          </pre>
        </ScrollArea>
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
              {/* Adversarial Intensity (formerly Conflict Score) */}
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

              {/* Article Breakdown - PRESENT clauses */}
              <Card className="bg-zinc-800 border-zinc-700 print:bg-white print:border-zinc-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 flex items-center gap-2 print:text-black">
                    <ShieldAlert className="w-5 h-5" />
                    Clause Risk Assessment
                    <span className="text-xs font-normal text-zinc-500 ml-2">(Present in Contract)</span>
                  </CardTitle>
                  <p className="text-xs text-zinc-500 mt-1">
                    Risk evaluation of clauses found in the document.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {optimizerData.article_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-900 rounded-lg border border-zinc-700 print:bg-white print:border-zinc-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-zinc-200 print:text-black">
                          {item.article} - {item.clause}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-zinc-400 print:text-zinc-600">{item.risk_summary}</p>
                    </div>
                  ))}
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
    </div>
  );
}
