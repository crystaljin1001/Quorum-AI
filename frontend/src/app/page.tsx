"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, FileSearch, Loader2 } from "lucide-react";

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

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 25) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Hazardous":
        return <Badge variant="destructive">{status}</Badge>;
      case "Warning":
        return <Badge className="bg-orange-500 hover:bg-orange-600">{status}</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Left Panel - The Evidence */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileSearch className="w-5 h-5" />
            The Evidence
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Contract under review</p>
        </div>
        <ScrollArea className="flex-1 p-4">
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
            {CONTRACT_TEXT}
          </pre>
        </ScrollArea>
      </div>

      {/* Right Panel - The Verdict */}
      <div className="w-1/2 flex flex-col bg-zinc-900">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                The Verdict
              </h2>
              <p className="text-sm text-zinc-400 mt-1">AI Risk Assessment Dashboard</p>
            </div>
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
              <p className="text-lg">Click "Scan for Risks" to analyze the contract</p>
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
              {/* Conflict Score */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 flex items-center justify-between">
                    <span>Conflict Score</span>
                    <Badge
                      className={`${
                        optimizerData.conflict_analysis.risk_level === "Critical"
                          ? "bg-red-600"
                          : optimizerData.conflict_analysis.risk_level === "High"
                          ? "bg-red-500"
                          : optimizerData.conflict_analysis.risk_level === "Medium"
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    >
                      {optimizerData.conflict_analysis.risk_level}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-bold text-zinc-100">
                        {optimizerData.conflict_analysis.score}
                      </span>
                      <span className="text-zinc-400">/100</span>
                    </div>
                    <Progress
                      value={optimizerData.conflict_analysis.score}
                      className={`h-3 ${getScoreColor(optimizerData.conflict_analysis.score)}`}
                    />
                    <p className="text-sm text-zinc-400 mt-2">
                      <strong>Primary Threat:</strong> {optimizerData.conflict_analysis.primary_threat}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skeptic's Key Catch */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100 text-base">Key Insight from Skeptic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 text-sm italic">
                    "{optimizerData.skeptic_validation.key_catch}"
                  </p>
                </CardContent>
              </Card>

              {/* Article Breakdown */}
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-100">Article Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {optimizerData.article_breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-900 rounded-lg border border-zinc-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-zinc-200">
                          {item.article} - {item.clause}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-zinc-400">{item.risk_summary}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Critical Omissions */}
              {optimizerData.critical_omissions.length > 0 && (
                <Card className="bg-zinc-800 border-red-900 border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Omissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {optimizerData.critical_omissions.map((omission, idx) => (
                      <Alert key={idx} variant="destructive" className="bg-red-950 border-red-900">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center justify-between">
                          {omission.missing_provision}
                          <Badge variant="destructive">{omission.severity}</Badge>
                        </AlertTitle>
                        <AlertDescription className="text-red-200">
                          {omission.impact}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Full Skeptic Critique */}
              {analysisResult && (
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-zinc-100">Full Skeptic Critique</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
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
