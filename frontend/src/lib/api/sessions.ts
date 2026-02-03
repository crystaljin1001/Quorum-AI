/**
 * API client for session management and PII workflow.
 */

import type {
  SessionCreateResponse,
  PIIApprovalRequest,
  PIIApprovalResponse,
  SessionStateResponse
} from "@/types/pii";

const API_BASE = "http://localhost:8000";

export async function createSession(documentText: string): Promise<SessionCreateResponse> {
  const response = await fetch(`${API_BASE}/sessions/create`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: documentText,
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

export async function approvePII(
  sessionId: string,
  request: PIIApprovalRequest
): Promise<PIIApprovalResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/approve-pii`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to approve PII: ${response.statusText}`);
  }

  return response.json();
}

export async function getSessionState(sessionId: string): Promise<SessionStateResponse> {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/state`);

  if (!response.ok) {
    throw new Error(`Failed to get session state: ${response.statusText}`);
  }

  return response.json();
}
