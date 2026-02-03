# Quorum Enhanced File Layout

## Overview
This document shows the proposed file organization for the enhanced PII detection system with human-in-the-loop validation.

---

## Backend Structure

```
backend/
│
├── main.py                          # FastAPI app (EXISTING - will be enhanced)
│   ├── POST /sessions/create        # NEW: Start analysis session
│   ├── POST /sessions/{id}/approve-pii  # NEW: Resume after human review
│   ├── GET  /sessions/{id}/state    # NEW: Get session state
│   ├── POST /pii/preview            # EXISTING
│   ├── POST /analyze                # EXISTING (will deprecate)
│   └── POST /remediate              # EXISTING
│
├── core/                            # NEW: Core business logic
│   ├── __init__.py
│   ├── pii_engine.py               # PIIEngine class - reversible pseudonymization
│   ├── session_manager.py          # Session lifecycle management
│   └── telemetry.py                # Analytics tracking (data moat)
│
├── models/                          # NEW: Pydantic models & TypedDicts
│   ├── __init__.py
│   ├── pii_models.py               # PIIEntity, PIIMapping, PIIRequest
│   ├── graph_state.py              # EnhancedGraphState, RemediationState
│   └── api_models.py               # SessionResponse, ApprovalRequest
│
├── graph/                           # NEW: Refactored from graph.py
│   ├── __init__.py
│   ├── social_brain.py             # Main analysis graph with PII workflow
│   ├── remediation.py              # Remediation workflow
│   └── nodes/
│       ├── __init__.py
│       ├── pii_nodes.py            # detect_pii, human_review_pii, anonymize
│       ├── agent_nodes.py          # creator, skeptic, optimizer
│       └── remediation_nodes.py    # remediation_creator, remediation_skeptic
│
├── prompts/                         # NEW: Organized prompts (from prompts.py)
│   ├── __init__.py
│   ├── creator.py                  # CREATOR_PROMPT
│   ├── skeptic.py                  # SKEPTIC_PROMPT
│   └── optimizer.py                # OPTIMIZER_PROMPT
│
├── storage/                         # NEW: Persistence layer
│   ├── __init__.py
│   ├── checkpointer.py             # SqliteSaver configuration
│   └── pii_store.py                # PII mapping CRUD operations
│
├── utils/                           # NEW: Utilities
│   ├── __init__.py
│   └── conflict_score.py           # $ConflictScore calculation
│
└── __init__.py                      # EXISTING
```

---

## Frontend Structure

```
frontend/src/
│
├── app/
│   ├── layout.tsx                  # EXISTING
│   ├── page.tsx                    # EXISTING: Landing + Privacy Preview
│   │
│   ├── workbench/                  # NEW: PII annotation interface
│   │   └── [sessionId]/
│   │       └── page.tsx            # Interactive PII review workbench
│   │
│   └── report/                     # EXISTING
│       └── [sessionId]/            # ENHANCED: Session-based routing
│           └── page.tsx            # Analysis dashboard
│
├── components/
│   ├── pii/                        # NEW: PII workbench components
│   │   ├── PIIWorkbench.tsx       # Main workbench component
│   │   ├── PIIHighlight.tsx       # Text renderer with highlights
│   │   ├── PIIControls.tsx        # Dismiss/tag controls sidebar
│   │   ├── PIIStats.tsx           # Real-time redaction statistics
│   │   └── PIIEntityCard.tsx      # Individual entity display
│   │
│   ├── RedlineDiff.tsx             # EXISTING
│   │
│   └── ui/                         # EXISTING: shadcn components
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       └── sheet.tsx
│
├── lib/
│   ├── api/                        # NEW: API client functions
│   │   ├── sessions.ts            # Session CRUD operations
│   │   ├── pii.ts                 # PII detection & approval
│   │   ├── graph.ts               # Graph execution & state
│   │   └── telemetry.ts           # Analytics event tracking
│   │
│   ├── hooks/                      # NEW: Custom React hooks
│   │   ├── usePIIAnnotation.ts   # Text selection & entity management
│   │   ├── useTelemetry.ts       # Dwell time & interaction tracking
│   │   ├── useGraphSession.ts    # Session state management
│   │   └── useTextSelection.ts   # Manual text range selection
│   │
│   ├── exportReport.ts             # EXISTING
│   └── utils.ts                    # EXISTING
│
└── types/                           # NEW: TypeScript type definitions
    ├── pii.ts                      # PIIEntity, PIIMapping, PIIRequest
    ├── graph.ts                    # GraphState, SessionResponse
    └── telemetry.ts                # TelemetryEvent, DwellTimeData
```

---

## Data Storage

```
data/
├── contracts/                       # EXISTING: Sample contracts
├── checkpoints.db                   # NEW: LangGraph SqliteSaver
└── telemetry.db                     # NEW: Analytics events (optional)
```

---

## New Dependencies

### Backend (requirements.txt)
```txt
# Add these lines:
langgraph-checkpoint-sqlite>=0.1.0
aiosqlite>=0.19.0
cryptography>=41.0.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react-text-annotate-blend": "^2.0.0",
    "@dnd-kit/core": "^6.1.0",
    "zustand": "^4.5.0"
  }
}
```

---

## Migration Strategy

### Step 1: Create New Structure (No Breaking Changes)
1. Create new directories: `backend/core/`, `backend/models/`, `backend/graph/`
2. Keep existing `graph.py`, `main.py`, `prompts.py` functional
3. Implement new `PIIEngine` in `backend/core/pii_engine.py`

### Step 2: Refactor Graph
1. Move state definitions from `graph.py` to `backend/models/graph_state.py`
2. Move node functions to `backend/graph/nodes/`
3. Create enhanced graph in `backend/graph/social_brain.py`
4. Keep old graph as fallback

### Step 3: Update Endpoints
1. Add new `/sessions/*` endpoints in `main.py`
2. Update `/analyze` to use new graph (or deprecate)
3. Keep `/pii/preview` and `/remediate` working

### Step 4: Frontend Integration
1. Build `PIIWorkbench` component
2. Add session routing
3. Update upload flow to use session-based workflow

---

## Quick Start Commands

```bash
# Backend: Create new directories
cd backend
mkdir -p core models graph/nodes prompts storage utils
touch core/__init__.py models/__init__.py graph/__init__.py prompts/__init__.py storage/__init__.py utils/__init__.py

# Frontend: Create new directories
cd frontend/src
mkdir -p components/pii lib/api lib/hooks types app/workbench/[sessionId]
touch types/pii.ts types/graph.ts types/telemetry.ts

# Install new dependencies
cd backend && pip install langgraph-checkpoint-sqlite aiosqlite cryptography
cd frontend && npm install react-text-annotate-blend @dnd-kit/core zustand
```

---

## Architecture Decision Records

### Why SqliteSaver?
- Simple file-based persistence (no external DB required)
- Native LangGraph integration
- Supports "time travel" for debugging
- Easy backup/restore

### Why Pseudonymization over Full Anonymization?
- Enables deanonymization for export/audit
- Maintains referential integrity (same person = same ID)
- Supports undo/manual corrections
- Required for building supervised learning data moat

### Why Session-Based Workflow?
- Enables interrupt/resume pattern
- Supports asynchronous human validation
- Allows multiple concurrent users
- Facilitates A/B testing different PII thresholds

---

**Last Updated:** 2026-01-28
