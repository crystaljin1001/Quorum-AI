# Quorum Enhanced PII Architecture Proposal

## Executive Summary
This document outlines the architecture for implementing an interactive PII detection system with human-in-the-loop validation, reversible pseudonymization, and telemetry-driven data moat construction.

---

## 1. Current Architecture Analysis

### Backend (Python/FastAPI)
```
backend/
├── __init__.py
├── main.py           # FastAPI endpoints (analyze, remediate, pii/preview)
├── graph.py          # LangGraph workflows (social_brain, remediation_graph)
└── prompts.py        # Agent system prompts
```

**Strengths:**
- Clean separation of concerns
- LangGraph already integrated
- Presidio already in requirements.txt
- Streaming remediation working

**Gaps:**
- No state persistence (checkpointing)
- No reversible PII mapping system
- No human-in-the-loop interrupt mechanism
- No telemetry/analytics layer
- No session management

### Frontend (Next.js/React)
```
frontend/src/
├── app/
│   ├── page.tsx      # Landing/upload with Privacy Airlock
│   └── report/
│       └── page.tsx  # Analysis dashboard with bi-directional linking
├── components/
│   ├── RedlineDiff.tsx
│   └── ui/           # shadcn components
└── lib/
    ├── exportReport.ts
    └── utils.ts
```

**Strengths:**
- Modern Next.js App Router
- shadcn/ui component system
- Dark mode theme established
- SSE streaming implemented

**Gaps:**
- No text annotation component
- No PII workbench interface
- No session/state management for interrupted workflows
- No telemetry tracking (dwell time, manual corrections)

---

## 2. Proposed Enhanced Architecture

### 2.1 Backend File Structure

```
backend/
├── __init__.py
├── main.py                      # FastAPI app + endpoints
│
├── core/                        # Core business logic
│   ├── __init__.py
│   ├── pii_engine.py           # PIIEngine class (NEW)
│   ├── session_manager.py      # Session/state management (NEW)
│   └── telemetry.py            # Analytics & data moat (NEW)
│
├── models/                      # Pydantic models
│   ├── __init__.py
│   ├── pii_models.py           # PII-related DTOs (NEW)
│   ├── graph_state.py          # TypedDict state schemas (NEW)
│   └── api_models.py           # Request/response models (NEW)
│
├── graph/                       # LangGraph workflows
│   ├── __init__.py
│   ├── social_brain.py         # Main analysis graph (REFACTOR from graph.py)
│   ├── remediation.py          # Remediation graph (REFACTOR from graph.py)
│   └── nodes/                  # Modular node functions
│       ├── __init__.py
│       ├── pii_nodes.py        # detect_pii, human_review_pii, anonymize (NEW)
│       ├── agent_nodes.py      # creator, skeptic, optimizer
│       └── remediation_nodes.py
│
├── prompts/                     # Agent prompts (organized)
│   ├── __init__.py
│   ├── creator.py
│   ├── skeptic.py
│   └── optimizer.py
│
├── storage/                     # Persistence layer
│   ├── __init__.py
│   ├── checkpointer.py         # SqliteSaver integration (NEW)
│   └── pii_store.py            # PII mapping store (NEW)
│
└── utils/
    ├── __init__.py
    └── conflict_score.py       # $ConflictScore calculation (NEW)
```

### 2.2 Frontend File Structure

```
frontend/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Landing + Privacy Preview
│   ├── workbench/              # PII Workbench (NEW)
│   │   └── [sessionId]/
│   │       └── page.tsx        # Interactive annotation interface
│   └── report/
│       └── page.tsx            # Analysis dashboard
│
├── components/
│   ├── pii/                    # PII-related components (NEW)
│   │   ├── PIIWorkbench.tsx   # Main annotation component
│   │   ├── PIIHighlight.tsx   # Text highlight renderer
│   │   ├── PIIControls.tsx    # Dismiss/Tag controls
│   │   └── PIIStats.tsx       # Real-time redaction stats
│   │
│   ├── RedlineDiff.tsx
│   └── ui/                     # shadcn components
│
├── lib/
│   ├── api/                    # API client functions (NEW)
│   │   ├── pii.ts             # PII workbench API calls
│   │   ├── graph.ts           # LangGraph session management
│   │   └── telemetry.ts       # Analytics tracking
│   │
│   ├── hooks/                  # Custom React hooks (NEW)
│   │   ├── usePIIAnnotation.ts
│   │   ├── useTelemetry.ts
│   │   └── useGraphSession.ts
│   │
│   ├── exportReport.ts
│   └── utils.ts
│
└── types/                       # TypeScript types (NEW)
    ├── pii.ts
    ├── graph.ts
    └── telemetry.ts
```

---

## 3. Core Component Specifications

### 3.1 PIIEngine Class (backend/core/pii_engine.py)

```python
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from typing import List, Dict, Tuple
import uuid

class PIIEntity:
    """Represents a detected PII entity with offset."""
    entity_type: str        # "PERSON", "EMAIL_ADDRESS", etc.
    start: int              # Character offset start
    end: int                # Character offset end
    text: str               # Original text
    confidence: float       # 0.0-1.0 (1.0 for manual)
    pseudo_id: str          # "[PERSON_1]" etc.
    source: str             # "machine" | "human"

class PIIEngine:
    """
    Core PII detection and pseudonymization engine.

    Features:
    - Detects PII with character offsets
    - Reversible pseudonymization with mapping dictionary
    - Manual override support with 1.0 confidence
    - Session-based mapping storage
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()
        self.mapping: Dict[str, str] = {}  # pseudo_id -> original_text
        self.reverse_mapping: Dict[str, str] = {}  # original_text -> pseudo_id

    def detect(self, text: str) -> List[PIIEntity]:
        """Run Presidio analysis and return entities with offsets."""

    def merge_manual_entities(self,
                             machine_entities: List[PIIEntity],
                             manual_offsets: List[Dict]) -> List[PIIEntity]:
        """Merge manual selections with machine detections, prioritize human."""

    def pseudonymize(self, text: str, entities: List[PIIEntity]) -> Tuple[str, Dict]:
        """
        Replace PII with pseudonyms and return mapping.
        Returns: (masked_text, mapping_dict)
        """

    def deanonymize(self, masked_text: str) -> str:
        """Reverse pseudonyms back to original text."""

    def save_mapping(self, storage):
        """Persist mapping to database."""

    def load_mapping(self, storage):
        """Load mapping from database."""
```

### 3.2 Enhanced LangGraph with Interrupts (backend/graph/social_brain.py)

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from typing import TypedDict, Annotated
import operator

class EnhancedGraphState(TypedDict):
    """Enhanced state with PII workflow."""
    session_id: str
    document: str                    # ORIGINAL (never exposed to LLMs)
    masked_document: str             # Pseudonymized version

    # PII workflow
    detected_entities: list          # Machine + human entities
    pii_approved: bool               # Human approval flag
    pii_mapping: dict                # Pseudonym -> original mapping

    # Agent workflow
    creator_summary: str
    skeptic_critique: str
    final_output: str

    # Telemetry
    pii_dwell_time_ms: int          # Time spent reviewing PII
    manual_corrections: int          # Count of manual edits

    messages: Annotated[list, operator.add]

# Node functions
def detect_pii_node(state: EnhancedGraphState):
    """Detect PII using PIIEngine."""
    from backend.core.pii_engine import PIIEngine

    engine = PIIEngine(state["session_id"])
    entities = engine.detect(state["document"])

    return {
        "detected_entities": [e.dict() for e in entities],
        "pii_approved": False
    }

def human_review_pii_node(state: EnhancedGraphState):
    """
    CRITICAL: Interrupt here for human validation.
    Uses interrupt("human_review_required") to pause execution.
    """
    from langgraph.graph import interrupt

    if not state.get("pii_approved"):
        # Pause execution and wait for frontend to resume
        interrupt("human_review_required")

    return {}

def anonymize_node(state: EnhancedGraphState):
    """Apply final PII masks based on validated entities."""
    from backend.core.pii_engine import PIIEngine

    engine = PIIEngine(state["session_id"])
    entities = [PIIEntity(**e) for e in state["detected_entities"]]
    masked_text, mapping = engine.pseudonymize(state["document"], entities)

    return {
        "masked_document": masked_text,
        "pii_mapping": mapping
    }

# Build graph with checkpointing
def build_enhanced_social_brain():
    checkpointer = SqliteSaver.from_conn_string("./data/checkpoints.db")

    workflow = StateGraph(EnhancedGraphState)

    # PII workflow
    workflow.add_node("detect_pii", detect_pii_node)
    workflow.add_node("human_review_pii", human_review_pii_node)
    workflow.add_node("anonymize", anonymize_node)

    # Agent workflow (existing)
    workflow.add_node("creator", creator_node)
    workflow.add_node("skeptic", skeptic_node)
    workflow.add_node("optimizer", optimizer_node)

    # Flow
    workflow.set_entry_point("detect_pii")
    workflow.add_edge("detect_pii", "human_review_pii")
    workflow.add_edge("human_review_pii", "anonymize")
    workflow.add_edge("anonymize", "creator")
    workflow.add_edge("creator", "skeptic")
    workflow.add_edge("skeptic", "optimizer")
    workflow.add_edge("optimizer", END)

    return workflow.compile(checkpointer=checkpointer)
```

### 3.3 FastAPI Endpoints with Interrupt/Resume (backend/main.py)

```python
from fastapi import FastAPI, HTTPException
from langgraph.checkpoint.sqlite import SqliteSaver
import uuid

@app.post("/sessions/create")
async def create_analysis_session(document: str):
    """
    Initiate a new analysis session.
    Returns session_id and immediately runs until first interrupt.
    """
    session_id = str(uuid.uuid4())

    config = {"configurable": {"thread_id": session_id}}
    initial_state = {
        "session_id": session_id,
        "document": document,
        "masked_document": "",
        "detected_entities": [],
        "pii_approved": False,
        ...
    }

    # Run until interrupt
    result = await enhanced_social_brain.ainvoke(initial_state, config)

    # Will stop at human_review_pii_node
    return {
        "session_id": session_id,
        "status": "awaiting_pii_review",
        "detected_entities": result["detected_entities"]
    }

@app.post("/sessions/{session_id}/approve-pii")
async def approve_pii_and_resume(
    session_id: str,
    validated_entities: List[Dict],  # User-edited entities
    telemetry: Dict  # dwell_time_ms, manual_corrections
):
    """
    Resume execution after human validation.
    Merges manual corrections and continues to agent workflow.
    """
    config = {"configurable": {"thread_id": session_id}}

    # Update state with validated entities
    update = {
        "detected_entities": validated_entities,
        "pii_approved": True,
        "pii_dwell_time_ms": telemetry["dwell_time_ms"],
        "manual_corrections": telemetry["manual_corrections"]
    }

    # Resume execution
    result = await enhanced_social_brain.ainvoke(update, config)

    return {
        "status": "complete",
        "final_output": result["final_output"]
    }

@app.get("/sessions/{session_id}/state")
async def get_session_state(session_id: str):
    """Get current state of a session (for time travel)."""
    config = {"configurable": {"thread_id": session_id}}
    state = enhanced_social_brain.get_state(config)
    return state
```

### 3.4 PIIWorkbench Component (frontend/src/components/pii/PIIWorkbench.tsx)

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { usePIIAnnotation } from '@/lib/hooks/usePIIAnnotation';
import { useTelemetry } from '@/lib/hooks/useTelemetry';

interface PIIEntity {
  entity_type: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
  source: 'machine' | 'human';
  dismissed?: boolean;
}

interface PIIWorkbenchProps {
  sessionId: string;
  documentText: string;
  detectedEntities: PIIEntity[];
  onApprove: (validatedEntities: PIIEntity[], telemetry: any) => void;
}

export function PIIWorkbench({
  sessionId,
  documentText,
  detectedEntities,
  onApprove
}: PIIWorkbenchProps) {
  const [entities, setEntities] = useState<PIIEntity[]>(detectedEntities);
  const [selectedRange, setSelectedRange] = useState<{start: number; end: number} | null>(null);

  const { trackDwellTime, trackManualCorrection, getTelemetry } = useTelemetry(sessionId);

  useEffect(() => {
    // Start tracking dwell time when component mounts
    trackDwellTime('start');
    return () => trackDwellTime('stop');
  }, []);

  const handleDismiss = useCallback((index: number) => {
    setEntities(prev =>
      prev.map((e, i) => i === index ? {...e, dismissed: true} : e)
    );
    trackManualCorrection('dismiss');
  }, []);

  const handleManualTag = useCallback((type: string) => {
    if (!selectedRange) return;

    const text = documentText.slice(selectedRange.start, selectedRange.end);
    const newEntity: PIIEntity = {
      entity_type: type,
      start: selectedRange.start,
      end: selectedRange.end,
      text,
      confidence: 1.0,
      source: 'human'
    };

    setEntities(prev => [...prev, newEntity]);
    setSelectedRange(null);
    trackManualCorrection('add');
  }, [selectedRange, documentText]);

  const handleApprove = useCallback(() => {
    const validatedEntities = entities.filter(e => !e.dismissed);
    const telemetry = getTelemetry();
    onApprove(validatedEntities, telemetry);
  }, [entities, onApprove, getTelemetry]);

  return (
    <div className="flex h-screen">
      {/* Left: Annotated Document */}
      <div className="flex-1">
        <PIIHighlight
          text={documentText}
          entities={entities}
          onTextSelect={setSelectedRange}
        />
      </div>

      {/* Right: Controls */}
      <div className="w-96">
        <PIIControls
          entities={entities}
          onDismiss={handleDismiss}
          onManualTag={handleManualTag}
          selectedRange={selectedRange}
        />

        <PIIStats entities={entities} />

        <Button onClick={handleApprove}>
          Approve & Continue to Analysis
        </Button>
      </div>
    </div>
  );
}
```

---

## 4. Key Features Implementation

### 4.1 Reversible Pseudonymization
- Use `[PERSON_1]`, `[EMAIL_1]` format (not `<PERSON_1>`)
- Store bidirectional mapping in session storage
- Enable deanonymization for export/review

### 4.2 Conflict Score Calculation
```python
# backend/utils/conflict_score.py
def calculate_conflict_score(creator_summary: str, skeptic_critique: str) -> int:
    """
    Calculate semantic conflict score 0-100.

    Options:
    1. Embedding-based: Cosine distance between embeddings
    2. Prompt-based: Ask LLM to score disagreement
    3. Heuristic: Count of contradictory keywords
    """
    # Implementation strategy TBD based on performance testing
```

### 4.3 Telemetry & Data Moat
```python
# backend/core/telemetry.py
class TelemetryTracker:
    """Track user interactions for data moat construction."""

    def track_pii_dwell_time(self, session_id: str, duration_ms: int):
        """How long user spent reviewing PII."""

    def track_manual_correction(self, session_id: str, action: str):
        """Track dismiss/add actions on PII entities."""

    def track_skeptic_engagement(self, session_id: str, critique_section: str, duration_ms: int):
        """Track time spent reading specific skeptic critiques."""
```

---

## 5. Database Schema

### 5.1 Session Checkpoints (SQLite via LangGraph)
```sql
-- Managed by SqliteSaver
CREATE TABLE checkpoints (
    thread_id TEXT,
    checkpoint_id TEXT,
    parent_checkpoint_id TEXT,
    checkpoint BLOB,
    metadata JSON
);
```

### 5.2 PII Mappings
```sql
CREATE TABLE pii_mappings (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    pseudo_id TEXT NOT NULL,          -- "[PERSON_1]"
    original_text TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_pseudo ON pii_mappings(session_id, pseudo_id);
```

### 5.3 Telemetry Events
```sql
CREATE TABLE telemetry_events (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    event_type TEXT NOT NULL,         -- "pii_dwell", "manual_correction", "skeptic_engagement"
    event_data JSON NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_session_events ON telemetry_events(session_id, event_type);
```

---

## 6. Dependency Updates

### Backend (requirements.txt)
```txt
# Add these:
langgraph-checkpoint-sqlite>=0.1.0   # State persistence
aiosqlite>=0.19.0                    # Async SQLite
cryptography>=41.0.0                 # For secure pseudonym generation
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react-text-annotate-blend": "^2.0.0",  // Text annotation
    "@dnd-kit/core": "^6.1.0",              // Drag-and-drop for manual tagging
    "zustand": "^4.5.0"                     // Session state management
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Core PII Engine (Week 1)
- [ ] Implement `PIIEngine` class with reversible mapping
- [ ] Add `detect_pii_node` and `anonymize_node` to graph
- [ ] Create `/sessions/create` endpoint
- [ ] Update `redact_pii()` to use PIIEngine

### Phase 2: Human-in-the-Loop (Week 2)
- [ ] Add `human_review_pii_node` with `interrupt()`
- [ ] Implement SqliteSaver checkpointing
- [ ] Create `/sessions/{id}/approve-pii` resume endpoint
- [ ] Build `PIIWorkbench` React component
- [ ] Add session state management to frontend

### Phase 3: Telemetry & Data Moat (Week 3)
- [ ] Implement `TelemetryTracker` class
- [ ] Add dwell time tracking to workbench
- [ ] Add manual correction tracking
- [ ] Create telemetry database schema
- [ ] Build analytics dashboard (internal)

### Phase 4: Conflict Score & Polish (Week 4)
- [ ] Implement `calculate_conflict_score()` utility
- [ ] Integrate into optimizer node
- [ ] Add score visualization to frontend
- [ ] End-to-end testing
- [ ] Performance optimization

---

## 8. Testing Strategy

### Unit Tests
- `PIIEngine`: Detection, pseudonymization, deanonymization
- `conflict_score`: Calculation accuracy
- Graph nodes: State transformations

### Integration Tests
- Full workflow: Upload → Detect → Review → Approve → Analyze
- Interrupt/Resume: Session persistence across restarts
- Telemetry: Event tracking accuracy

### E2E Tests
- Selenium/Playwright: Complete user flow
- Load testing: Multiple concurrent sessions
- Security: PII never logged, proper isolation

---

## 9. Security Considerations

1. **PII Isolation**: Original text never touches LLM APIs
2. **Session Secrets**: Encrypt pseudonym mappings at rest
3. **Access Control**: Session-based auth (future: user accounts)
4. **Audit Logging**: Track all PII access for compliance
5. **Data Retention**: Auto-delete sessions after 30 days

---

## 10. Next Steps

1. **Review this proposal** with the team
2. **Clarify requirements**:
   - Text annotation library preference?
   - Conflict score calculation method?
   - Telemetry detail level?
3. **Scaffold Phase 1** file structure
4. **Implement PIIEngine** as first deliverable

---

**Document Version:** 1.0
**Date:** 2026-01-28
**Author:** Senior AI Engineer (Claude)
