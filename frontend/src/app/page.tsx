"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Upload, Lock } from "lucide-react";

type AnimationPhase = "idle" | "scanning" | "redacting-names" | "masking-values" | "complete";

export default function LandingPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const processFile = useCallback(async (file: File) => {
    setUploadedFileName(file.name);

    // Read file content
    const text = await file.text();

    // Store in localStorage
    localStorage.setItem("quorum-contract", text);

    // Start animation sequence
    setAnimationPhase("scanning");

    // Phase 1: Scanning (1.5s)
    setTimeout(() => {
      setAnimationPhase("redacting-names");
    }, 1500);

    // Phase 2: Redacting names (1.5s)
    setTimeout(() => {
      setAnimationPhase("masking-values");
    }, 3000);

    // Phase 3: Masking values (1.5s)
    setTimeout(() => {
      setAnimationPhase("complete");
    }, 4500);

    // Redirect to report (brief confirmation then redirect)
    setTimeout(() => {
      router.push("/report");
    }, 5500);
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
      {/* Main Upload Interface */}
      {animationPhase === "idle" && (
        <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="bg-zinc-900 border-2 border-zinc-700 shadow-2xl">
            <CardContent className="pt-12 pb-12 px-6 sm:px-12">
              {/* Header */}
              <div className="flex flex-col items-center mb-10">
                <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-zinc-100" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3 text-center">Quorum Data Room</h1>
                <p className="text-zinc-300 text-center max-w-md text-lg">
                  Upload your contract for AI-powered risk analysis
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Animation Overlay */}
      {animationPhase !== "idle" && (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50 px-4">
          <div className="w-full max-w-4xl">
            <Card className="bg-zinc-900 border-2 border-zinc-700 shadow-2xl">
              <CardContent className="pt-12 pb-12 px-6 sm:px-12">
                {/* Animation Header */}
                <div className="flex flex-col items-center mb-10">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center mb-6 shadow-lg">
                    <Shield className={`w-10 h-10 text-white ${
                      animationPhase === "scanning" ? "animate-pulse" : ""
                    }`} />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3 text-center">
                    {animationPhase === "scanning" && "Scanning for PII..."}
                    {animationPhase === "redacting-names" && "Redacting Names..."}
                    {animationPhase === "masking-values" && "Masking Deal Values..."}
                    {animationPhase === "complete" && "Airlock Complete"}
                  </h2>
                  <p className="text-zinc-400 text-base font-medium">{uploadedFileName}</p>
                </div>

                {/* Mock Document with Redaction Animation */}
                <div className="bg-black rounded-xl p-8 font-mono text-base leading-relaxed border-2 border-zinc-800">
                  {/* Phase 1: Scanning */}
                  {animationPhase === "scanning" && (
                    <div className="relative">
                      <div className="text-zinc-300 space-y-3">
                        <p>**Effective Date:** January 15, 2024</p>
                        <p>**Parties:**</p>
                        <p>- Company Representative: John Smith</p>
                        <p>- Contract Value: $150.00 per share</p>
                        <p>- Rights Agent: Jane Doe</p>
                      </div>
                      {/* Scanner line */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan shadow-lg shadow-red-500/50" />
                      </div>
                    </div>
                  )}

                  {/* Phase 2: Redacting Names */}
                  {animationPhase === "redacting-names" && (
                    <div className="text-zinc-300 space-y-3">
                      <p>**Effective Date:** January 15, 2024</p>
                      <p>**Parties:**</p>
                      <p className="flex items-center gap-2 flex-wrap">
                        - Company Representative:{" "}
                        <span className="inline-block px-4 py-1.5 bg-red-950 border-2 border-red-500 text-red-400 rounded font-bold animate-fadeIn shadow-lg shadow-red-500/30">
                          &lt;REDACTED&gt;
                        </span>
                      </p>
                      <p>- Contract Value: $150.00 per share</p>
                      <p className="flex items-center gap-2 flex-wrap">
                        - Rights Agent:{" "}
                        <span className="inline-block px-4 py-1.5 bg-red-950 border-2 border-red-500 text-red-400 rounded font-bold animate-fadeIn shadow-lg shadow-red-500/30">
                          &lt;REDACTED&gt;
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Phase 3: Masking Values */}
                  {animationPhase === "masking-values" && (
                    <div className="text-zinc-300 space-y-3">
                      <p>**Effective Date:** January 15, 2024</p>
                      <p>**Parties:**</p>
                      <p className="flex items-center gap-2 flex-wrap">
                        - Company Representative:{" "}
                        <span className="inline-block px-4 py-1.5 bg-red-950 border-2 border-red-500 text-red-400 rounded font-bold shadow-lg shadow-red-500/30">
                          &lt;REDACTED&gt;
                        </span>
                      </p>
                      <p className="flex items-center gap-2 flex-wrap">
                        - Contract Value:{" "}
                        <span className="inline-block px-4 py-1.5 bg-red-950 border-2 border-red-500 text-red-400 rounded font-bold animate-fadeIn shadow-lg shadow-red-500/30">
                          &lt;REDACTED&gt;
                        </span>
                        {" "}per share
                      </p>
                      <p className="flex items-center gap-2 flex-wrap">
                        - Rights Agent:{" "}
                        <span className="inline-block px-4 py-1.5 bg-red-950 border-2 border-red-500 text-red-400 rounded font-bold shadow-lg shadow-red-500/30">
                          &lt;REDACTED&gt;
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Phase 4: Complete */}
                  {animationPhase === "complete" && (
                    <div className="text-center py-6">
                      <div className="inline-flex items-center gap-4 px-8 py-4 bg-green-950 border-2 border-green-500 text-green-400 rounded-xl shadow-xl shadow-green-500/30">
                        <Shield className="w-6 h-6" />
                        <span className="font-bold text-lg">Privacy Airlock Complete</span>
                      </div>
                      <p className="text-zinc-400 mt-6 text-base font-medium">Redirecting to analysis dashboard...</p>
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                {animationPhase !== "complete" && (
                  <div className="mt-10 flex justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      animationPhase === "scanning" ? "bg-red-500 shadow-lg shadow-red-500/50 scale-125" : "bg-zinc-700"
                    }`} />
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      animationPhase === "redacting-names" ? "bg-red-500 shadow-lg shadow-red-500/50 scale-125" : "bg-zinc-700"
                    }`} />
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      animationPhase === "masking-values" ? "bg-red-500 shadow-lg shadow-red-500/50 scale-125" : "bg-zinc-700"
                    }`} />
                  </div>
                )}
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
            transform: translateY(200px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scan {
          animation: scan 1.5s ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
