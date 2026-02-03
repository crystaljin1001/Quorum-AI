"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PIIWorkbench } from "@/components/pii/PIIWorkbench";
import { useTelemetry } from "@/lib/hooks/useTelemetry";
import { approvePII, getSessionState } from "@/lib/api/sessions";
import { Loader2, AlertTriangle } from "lucide-react";
import type { PIIEntity } from "@/types/pii";

export default function WorkbenchPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [documentText, setDocumentText] = useState<string>("");
  const [detectedEntities, setDetectedEntities] = useState<PIIEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { trackManualCorrection, getTelemetry } = useTelemetry(sessionId);

  // Load session state on mount
  useEffect(() => {
    async function loadSession() {
      try {
        setIsLoading(true);

        // Get document from localStorage (temporary - should be from session state)
        const storedDoc = localStorage.getItem(`quorum-session-${sessionId}`);
        if (!storedDoc) {
          throw new Error("Document not found. Please start over.");
        }

        const sessionData = JSON.parse(storedDoc);
        setDocumentText(sessionData.document);
        setDetectedEntities(sessionData.detected_entities);

        console.log(`✅ Loaded session ${sessionId} with ${sessionData.detected_entities.length} entities`);
      } catch (err) {
        console.error("Error loading session:", err);
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const handleApprove = async (validatedEntities: PIIEntity[]) => {
    try {
      setIsProcessing(true);
      console.log(`🚀 Approving PII for session ${sessionId}`);

      // Calculate telemetry stats
      const originalEntitiesCount = detectedEntities.length;
      const dismissedCount = detectedEntities.filter(e =>
        validatedEntities.find(v => v.start === e.start && v.end === e.end)?.dismissed
      ).length;
      const addedCount = validatedEntities.filter(e => e.source === "human" && !e.dismissed).length;

      const telemetry = getTelemetry();
      const fullTelemetry = {
        ...telemetry,
        dismissed_count: dismissedCount,
        added_count: addedCount,
        manual_corrections: dismissedCount + addedCount
      };

      console.log(`📊 Telemetry: dwell_time=${fullTelemetry.dwell_time_ms}ms, ` +
                 `dismissed=${dismissedCount}, added=${addedCount}, total_corrections=${fullTelemetry.manual_corrections}`);

      const response = await approvePII(sessionId, {
        validated_entities: validatedEntities,
        telemetry: fullTelemetry
      });

      console.log(`✅ PII approved, analysis complete`);

      // Store result and redirect to report
      localStorage.setItem("quorum-contract", response.masked_document || "");
      localStorage.setItem("quorum-analysis-result", JSON.stringify({
        creator_summary: "",
        skeptic_critique: "",
        final_output: response.final_output,
        messages: []
      }));

      router.push("/report");
    } catch (err) {
      console.error("Error approving PII:", err);
      setError(err instanceof Error ? err.message : "Failed to approve PII");
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem(`quorum-session-${sessionId}`);
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mb-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-white">Loading Session...</p>
          <p className="text-base mt-3 text-zinc-300 font-medium">{sessionId.slice(0, 8)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Session</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mb-6 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold text-white">Processing Approved PII...</p>
          <p className="text-base mt-3 text-zinc-300 font-medium">Running Social Brain analysis</p>
        </div>
      </div>
    );
  }

  return (
    <PIIWorkbench
      sessionId={sessionId}
      documentText={documentText}
      detectedEntities={detectedEntities}
      onApprove={handleApprove}
      onCancel={handleCancel}
    />
  );
}
