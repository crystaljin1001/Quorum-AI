"""Pydantic models for API requests and responses."""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional


class PIIEntityModel(BaseModel):
    """PII entity for API transfer."""
    entity_type: str
    start: int
    end: int
    text: str
    confidence: float
    pseudo_id: str
    source: str  # "machine" | "human"
    dismissed: bool = False


class SessionCreateResponse(BaseModel):
    """Response for POST /sessions/create."""
    session_id: str
    status: str  # "awaiting_pii_review"
    detected_entities: List[PIIEntityModel]
    total_entities: int
    redaction_summary: Dict[str, int]


class SessionStateResponse(BaseModel):
    """Response for GET /sessions/{id}/state."""
    session_id: str
    status: str
    current_node: Optional[str] = None
    detected_entities: Optional[List[PIIEntityModel]] = None
    creator_summary: Optional[str] = None
    skeptic_critique: Optional[str] = None
    final_output: Optional[str] = None


class TelemetryData(BaseModel):
    """Telemetry tracking data from frontend."""
    dwell_time_ms: int = Field(..., description="Time spent reviewing PII in milliseconds")
    manual_corrections: int = Field(0, description="Number of manual dismiss/add actions")
    dismissed_count: int = Field(0, description="Number of false positives dismissed")
    added_count: int = Field(0, description="Number of manually tagged entities")


class PIIApprovalRequest(BaseModel):
    """Request for POST /sessions/{id}/approve-pii."""
    validated_entities: List[PIIEntityModel]
    telemetry: TelemetryData


class PIIApprovalResponse(BaseModel):
    """Response for POST /sessions/{id}/approve-pii."""
    session_id: str
    status: str  # "processing" | "complete"
    masked_document: Optional[str] = None
    final_output: Optional[str] = None
