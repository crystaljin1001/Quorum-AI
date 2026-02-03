/**
 * Custom hook for tracking telemetry data in PII workbench.
 *
 * Tracks:
 * - Dwell time: How long user spends reviewing PII
 * - Manual corrections: Number of dismiss/add actions
 */

import { useState, useCallback, useRef } from "react";
import type { TelemetryData } from "@/types/pii";

export function useTelemetry(sessionId: string) {
  const [startTime] = useState<number>(Date.now());
  const [manualCorrections, setManualCorrections] = useState(0);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [addedCount, setAddedCount] = useState(0);

  const trackManualCorrection = useCallback((action: "dismiss" | "add") => {
    setManualCorrections(prev => prev + 1);

    if (action === "dismiss") {
      setDismissedCount(prev => prev + 1);
    } else {
      setAddedCount(prev => prev + 1);
    }

    console.log(`📊 Telemetry: ${action} action tracked for session ${sessionId}`);
  }, [sessionId]);

  const getTelemetry = useCallback((): TelemetryData => {
    const dwellTimeMs = Date.now() - startTime;

    return {
      dwell_time_ms: dwellTimeMs,
      manual_corrections: manualCorrections,
      dismissed_count: dismissedCount,
      added_count: addedCount
    };
  }, [startTime, manualCorrections, dismissedCount, addedCount]);

  return {
    trackManualCorrection,
    getTelemetry,
    manualCorrections,
    dismissedCount,
    addedCount
  };
}
