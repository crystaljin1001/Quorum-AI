"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Upload, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createSession } from "@/lib/api/sessions";

type FlowPhase = "idle" | "scanning" | "redirect";

export default function LandingPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadedFileName(file.name);
    setError(null);
    setFlowPhase("scanning");
    setIsProcessing(true);

    try {
      // Read file content
      const text = await file.text();

      // Create new analysis session with human-in-the-loop PII validation
      console.log("📤 Creating analysis session...");
      const sessionResponse = await createSession(text);

      console.log(`✅ Session created: ${sessionResponse.session_id}`);
      console.log(`🔍 Detected ${sessionResponse.total_entities} PII entities`);

      // Store session data temporarily (for workbench to load)
      localStorage.setItem(`quorum-session-${sessionResponse.session_id}`, JSON.stringify({
        document: text,
        detected_entities: sessionResponse.detected_entities,
        redaction_summary: sessionResponse.redaction_summary
      }));

      // Redirect to workbench for human validation
      setFlowPhase("redirect");
      setTimeout(() => {
        router.push(`/workbench/${sessionResponse.session_id}`);
      }, 1000);

    } catch (err) {
      console.error("Error creating session:", err);
      setError(err instanceof Error ? err.message : "Failed to process file");
      setFlowPhase("idle");
      setIsProcessing(false);
    }
  }, [router]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const validTypes = [".txt", ".md"];
    const fileExt = file.name.slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(fileExt.toLowerCase())) {
      alert("Please upload a .txt or .md file");
      return;
    }

    processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  }, [handleFileSelect]);


  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black">
      {/* Idle: Upload Interface */}
      {flowPhase === "idle" && (
        <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-zinc-900 border-2 border-zinc-700 shadow-2xl">
            <CardContent className="pt-12 pb-12 px-6 sm:px-12">
              {/* Header */}
              <div className="flex flex-col items-center mb-10">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-zinc-100" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 text-center">Quorum AI</h1>
                <p className="text-zinc-300 text-center max-w-md text-lg">
                  AI-powered M&A contract risk analysis
                </p>
              </div>

              {/* Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-3 border-dashed rounded-xl p-12 transition-all duration-200 ${
                  isDragging
                    ? "border-orange-500 bg-orange-950/30 shadow-lg shadow-orange-500/20"
                    : "border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex flex-col items-center gap-5">
                  <Upload className="w-14 h-14 text-zinc-400" />
                  <div className="text-center">
                    <p className="text-white text-lg mb-2 font-medium">
                      Drag and drop your contract here, or click to browse
                    </p>
                    <p className="text-sm text-zinc-400">
                      Supports .txt and .md files
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      asChild
                      className="bg-zinc-700 hover:bg-zinc-600 text-white border-2 border-zinc-500 shadow-lg font-semibold px-8 py-3 text-base"
                    >
                      <span className="cursor-pointer">Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="mt-8 flex items-center justify-center gap-3 text-sm text-zinc-400 bg-zinc-800/50 rounded-lg py-3 px-4 border border-zinc-700">
                <Lock className="w-5 h-5 text-green-500" />
                <p className="font-medium">Privacy-first: All PII is redacted before AI processing</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 flex items-center gap-3 text-sm text-red-400 bg-red-950/30 rounded-lg py-3 px-4 border-2 border-red-500">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scanning Phase */}
      {flowPhase === "scanning" && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-2xl">
            <Card className="bg-zinc-900 border-2 border-zinc-700 shadow-2xl">
              <CardContent className="pt-12 pb-12 px-6 sm:px-12">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                    <Shield className="w-10 h-10 text-blue-500 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 text-center">
                    Detecting PII...
                  </h2>
                  <p className="text-zinc-400 text-base font-medium mb-8">{uploadedFileName}</p>

                  {/* Scanning Animation */}
                  <div className="w-full bg-zinc-800 rounded-lg p-6 border-2 border-zinc-700 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan shadow-lg shadow-blue-500/50" />
                    </div>
                    <div className="text-zinc-400 text-center font-mono">
                      Creating session and detecting sensitive entities...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Redirect Phase */}
      {flowPhase === "redirect" && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-2xl">
            <Card className="bg-zinc-900 border-2 border-blue-500 shadow-2xl shadow-blue-500/30">
              <CardContent className="pt-12 pb-12 px-6 sm:px-12">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-blue-950 border-2 border-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 animate-pulse">
                    <CheckCircle2 className="w-10 h-10 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 text-center">
                    PII Detection Complete
                  </h2>
                  <p className="text-zinc-300 text-base font-medium">
                    Redirecting to validation workbench...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}


      {/* Custom animations */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(400px);
          }
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
