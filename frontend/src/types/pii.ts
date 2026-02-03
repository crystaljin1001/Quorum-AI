/**
 * TypeScript types for PII workbench and session management.
 */

export interface PIIEntity {
  entity_type: string;      // "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER"
  start: number;            // Character offset start
  end: number;              // Character offset end
  text: string;             // Original text
  confidence: number;       // 0.0-1.0
  pseudo_id: string;        // "[PERSON_1]", etc.
  source: "machine" | "human";
  dismissed: boolean;
}

export interface SessionCreateResponse {
  session_id: string;
  status: string;
  detected_entities: PIIEntity[];
  total_entities: number;
  redaction_summary: Record<string, number>;
}

export interface TelemetryData {
  dwell_time_ms: number;
  manual_corrections: number;
  dismissed_count: number;
  added_count: number;
}

export interface PIIApprovalRequest {
  validated_entities: PIIEntity[];
  telemetry: TelemetryData;
}

export interface PIIApprovalResponse {
  session_id: string;
  status: string;
  masked_document: string | null;
  final_output: string | null;
}

export interface SessionStateResponse {
  session_id: string;
  status: string;
  current_node: string | null;
  detected_entities: PIIEntity[] | null;
  creator_summary: string | null;
  skeptic_critique: string | null;
  final_output: string | null;
}
