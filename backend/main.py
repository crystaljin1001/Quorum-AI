"""
FastAPI server for the Quorum Social Brain document analysis.
"""

import os
import logging
import json
import asyncio
from contextlib import asynccontextmanager
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine

from .graph import social_brain, remediation_graph
from .core.pii_engine import PIIEngine, PIIEntity
from .storage.session_store import session_store
from .models.api_models import (
    SessionCreateResponse,
    SessionStateResponse,
    PIIApprovalRequest,
    PIIApprovalResponse,
    PIIEntityModel,
    TelemetryData
)
import uuid

# Load environment variables
load_dotenv()

# Configure logging - but never print PII
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Presidio engines for Privacy Airlock
# Use the smaller spaCy model to save disk space
nlp_config = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}
nlp_engine = NlpEngineProvider(nlp_configuration=nlp_config).create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])
anonymizer = AnonymizerEngine()

# Entity types to detect and redact
PII_ENTITIES = ["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS"]


def redact_pii(text: str) -> tuple[str, int, dict]:
    """
    Privacy Airlock: Detect and redact PII from text.

    Detects PERSON, PHONE_NUMBER, and EMAIL_ADDRESS entities
    and replaces them with numbered placeholders like <PERSON_1>, <EMAIL_2>.

    Args:
        text: The input text to redact

    Returns:
        tuple: (redacted_text, total_count, redaction_summary_dict)
    """
    # Analyze text for PII entities
    results = analyzer.analyze(
        text=text,
        entities=PII_ENTITIES,
        language="en"
    )

    if not results:
        return text, 0, {}

    # Sort results by start position (descending) for safe replacement
    results = sorted(results, key=lambda x: x.start, reverse=True)

    # Track entity counts for numbered placeholders
    entity_counters = defaultdict(int)
    entity_count = len(results)

    # Create a mutable copy of the text
    redacted_text = text

    # Replace each entity with a numbered placeholder
    for result in results:
        entity_type = result.entity_type
        entity_counters[entity_type] += 1
        placeholder = f"<{entity_type}_{entity_counters[entity_type]}>"
        redacted_text = redacted_text[:result.start] + placeholder + redacted_text[result.end:]

    # Build redaction summary with friendly names
    redaction_summary = {
        "Names": entity_counters.get("PERSON", 0),
        "Phone Numbers": entity_counters.get("PHONE_NUMBER", 0),
        "Email Addresses": entity_counters.get("EMAIL_ADDRESS", 0),
    }
    # Remove zero counts
    redaction_summary = {k: v for k, v in redaction_summary.items() if v > 0}

    return redacted_text, entity_count, redaction_summary


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Quorum Social Brain server...")
    yield
    logger.info("Shutting down Quorum Social Brain server...")


app = FastAPI(
    title="Quorum Social Brain API",
    description="Multi-agent legal document analysis using Creator, Skeptic, and Optimizer",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "quorum-social-brain"}


@app.post("/sessions/create", response_model=SessionCreateResponse)
async def create_analysis_session(request: Request):
    """
    Create a new analysis session with human-in-the-loop PII validation.

    This is Step 1 of the enhanced workflow:
    1. Upload document -> detect PII -> pause for human review
    2. Human approves/edits PII -> resume analysis workflow
    3. Social Brain agents process masked document

    Returns:
        Session ID and detected PII entities for user validation
    """
    try:
        # Read document text
        document = await request.body()
        document_text = document.decode("utf-8")

        if not document_text.strip():
            raise HTTPException(status_code=400, detail="Empty document provided")

        # Generate unique session ID
        session_id = str(uuid.uuid4())
        logger.info(f"🆔 Creating session {session_id} (document length: {len(document_text)} chars)")

        # Initialize PII engine for this session
        pii_engine = PIIEngine(session_id)

        # Run automated PII detection
        detected_entities = pii_engine.detect(document_text)
        logger.info(f"🔍 Detected {len(detected_entities)} PII entities in session {session_id}")

        # Get redaction summary
        redaction_summary = pii_engine.get_redaction_summary(detected_entities)

        # Store session state (awaiting human validation)
        session_store.create_session(
            session_id=session_id,
            document=document_text,  # Original (never exposed to LLMs)
            detected_entities=[e.to_dict() for e in detected_entities],
            pii_mapping=pii_engine.save_mapping()
        )

        logger.info(f"✅ Session {session_id} created, awaiting PII approval")

        # Convert PIIEntity to PIIEntityModel for API response
        entity_models = [
            PIIEntityModel(**e.to_dict()) for e in detected_entities
        ]

        return SessionCreateResponse(
            session_id=session_id,
            status="awaiting_pii_review",
            detected_entities=entity_models,
            total_entities=len(detected_entities),
            redaction_summary=redaction_summary
        )

    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{session_id}/approve-pii", response_model=PIIApprovalResponse)
async def approve_pii_and_continue(
    session_id: str,
    approval: PIIApprovalRequest
):
    """
    Approve PII validation and continue to Social Brain analysis.

    This is Step 2 of the enhanced workflow:
    - User has reviewed/edited PII entities in the workbench
    - Apply validated entities to mask document
    - Run Social Brain workflow on masked document

    Args:
        session_id: Session identifier from /sessions/create
        approval: Validated entities and telemetry data

    Returns:
        Analysis results from Social Brain workflow
    """
    try:
        # Retrieve session
        session = session_store.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        logger.info(f"👤 Human approval received for session {session_id}")
        logger.info(f"📊 Telemetry: dwell_time={approval.telemetry.dwell_time_ms}ms, "
                   f"corrections={approval.telemetry.manual_corrections}")

        # Get original document
        original_document = session["document"]

        # Initialize PII engine and load previous mapping
        pii_engine = PIIEngine(session_id)
        pii_engine.load_mapping(session["pii_mapping"])

        # Convert validated entities back to PIIEntity objects
        validated_entities = [
            PIIEntity(
                entity_type=e.entity_type,
                start=e.start,
                end=e.end,
                text=e.text,
                confidence=e.confidence,
                pseudo_id=e.pseudo_id,
                source=e.source,
                dismissed=e.dismissed
            )
            for e in approval.validated_entities
        ]

        # Apply pseudonymization with validated entities
        masked_document, pii_mapping = pii_engine.pseudonymize(
            original_document,
            validated_entities
        )

        logger.info(f"🔒 Applied PII masking for session {session_id}")

        # Update session with approved PII
        session_store.approve_pii(
            session_id=session_id,
            validated_entities=[e.to_dict() for e in validated_entities],
            masked_document=masked_document,
            pii_mapping=pii_mapping,
            telemetry=approval.telemetry.dict()
        )

        # Run Social Brain analysis on masked document
        logger.info(f"🧠 Starting Social Brain analysis for session {session_id}")

        initial_state = {
            "document": masked_document,  # Use MASKED version
            "creator_summary": "",
            "skeptic_critique": "",
            "final_output": "",
            "messages": []
        }

        # Run the graph
        result = await social_brain.ainvoke(initial_state)

        # Store analysis results
        session_store.set_analysis_results(
            session_id=session_id,
            creator_summary=result["creator_summary"],
            skeptic_critique=result["skeptic_critique"],
            final_output=result["final_output"]
        )

        logger.info(f"✅ Analysis complete for session {session_id}")

        return PIIApprovalResponse(
            session_id=session_id,
            status="complete",
            masked_document=masked_document,
            final_output=result["final_output"]
        )

    except Exception as e:
        logger.error(f"Error during PII approval for session {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}/state", response_model=SessionStateResponse)
async def get_session_state(session_id: str):
    """
    Get current state of an analysis session.

    Useful for:
    - Checking progress
    - Resuming interrupted workflows
    - Debugging

    Args:
        session_id: Session identifier

    Returns:
        Current session state
    """
    try:
        session = session_store.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        # Convert detected entities to PIIEntityModel if present
        detected_entities = None
        if session.get("detected_entities"):
            detected_entities = [
                PIIEntityModel(**e) for e in session["detected_entities"]
            ]

        return SessionStateResponse(
            session_id=session_id,
            status=session["status"],
            current_node=None,  # TODO: Add when using LangGraph checkpointing
            detected_entities=detected_entities,
            creator_summary=session.get("creator_summary"),
            skeptic_critique=session.get("skeptic_critique"),
            final_output=session.get("final_output")
        )

    except Exception as e:
        logger.error(f"Error getting session state for {session_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/pii/preview")
async def preview_pii_redaction(request: Request):
    """
    Privacy Preview endpoint: Shows users PII-masked version of their contract.

    This is the first step in the Privacy Airlock flow. Accepts raw contract text,
    detects PII using Presidio, and returns both the masked text and a detailed
    redaction summary for user approval before processing.

    Returns:
        {
            "masked_text": "Contract with <PERSON_1> replaced...",
            "redaction_summary": {"Names": 14, "Email Addresses": 3},
            "total_redactions": 17,
            "original_length": 50000,
            "masked_length": 50050
        }
    """
    try:
        # Read the raw document text
        document = await request.body()
        document_text = document.decode("utf-8")

        if not document_text.strip():
            raise HTTPException(status_code=400, detail="Empty document provided")

        original_length = len(document_text)
        logger.info("🔍 PII Preview: Scanning document (length: %d chars)", original_length)

        # Run Privacy Airlock scan
        masked_text, total_redactions, redaction_summary = redact_pii(document_text)
        masked_length = len(masked_text)

        logger.info("🔒 PII Preview: Found %d sensitive entities", total_redactions)
        if total_redactions > 0:
            logger.info("🔒 PII Preview: Breakdown - %s", redaction_summary)

        return {
            "masked_text": masked_text,
            "redaction_summary": redaction_summary,
            "total_redactions": total_redactions,
            "original_length": original_length,
            "masked_length": masked_length,
        }

    except Exception as e:
        logger.error("Error during PII preview: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_document(request: Request):
    """
    Analyze a document through the Social Brain pipeline.

    Accepts plain text document content and runs it through:
    1. Privacy Airlock (Presidio) - redacts PII
    2. The Creator (Claude 3.5 Sonnet) - drafts summary
    3. The Skeptic (DeepSeek R1) - finds risks and loopholes
    4. The Optimizer (GPT-4o-mini) - synthesizes and scores conflicts
    """
    try:
        # Read the raw document text
        document = await request.body()
        document_text = document.decode("utf-8")

        if not document_text.strip():
            raise HTTPException(status_code=400, detail="Empty document provided")

        logger.info("Received document for analysis (length: %d chars)", len(document_text))

        # Privacy Airlock: Redact PII before processing
        redacted_text, entity_count, redaction_summary = redact_pii(document_text)
        if entity_count > 0:
            print(f"🔒 Privacy Airlock: Redacted {entity_count} sensitive entities before processing.")
            logger.info("🔒 Privacy Airlock: Redacted %d sensitive entities before processing.", entity_count)
        else:
            logger.info("🔒 Privacy Airlock: No PII detected in document.")

        # Run through the Social Brain graph
        logger.info("Starting Social Brain analysis...")

        initial_state = {
            "document": redacted_text,  # Use redacted text from Privacy Airlock
            "creator_summary": "",
            "skeptic_critique": "",
            "final_output": "",
            "messages": []
        }

        # Run the graph
        logger.info("=== CREATOR NODE ===")
        result = await social_brain.ainvoke(initial_state)

        logger.info("=== CREATOR RESPONSE ===")
        logger.debug("Creator summary length: %d chars", len(result.get("creator_summary", "")))

        logger.info("=== SKEPTIC REASONING ===")
        skeptic_output = result.get("skeptic_critique", "")
        logger.debug("Skeptic critique length: %d chars", len(skeptic_output))
        # Log skeptic reasoning for debugging (check for thinking tags)
        if "<thinking>" in skeptic_output or "thinking" in skeptic_output.lower():
            logger.info("DeepSeek thinking tags detected in Skeptic output")

        logger.info("=== OPTIMIZER RESPONSE ===")
        logger.debug("Final output length: %d chars", len(result.get("final_output", "")))

        logger.info("Analysis complete!")

        return {
            "creator_summary": result["creator_summary"],
            "skeptic_critique": result["skeptic_critique"],
            "final_output": result["final_output"],
            "messages": result["messages"]
        }

    except Exception as e:
        logger.error("Error during analysis: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/remediate")
async def remediate_clause_stream(request: Request):
    """
    Stream remediation process using Server-Sent Events (SSE).

    Streams intermediate reasoning from Creator and Skeptic agents,
    then sends final result with rewritten clause and rationale.

    Request body should be JSON:
    {
        "clause_text": "The original hazardous clause text...",
        "risk_description": "Description of why this clause is risky..."
    }

    Streams SSE events:
    - event: agent_start - When an agent starts processing
    - event: agent_progress - Intermediate thinking/progress
    - event: agent_complete - When an agent finishes
    - event: complete - Final result with original, rewritten, rationale
    - event: error - If an error occurs
    """
    try:
        # Parse request body
        body = await request.json()
        clause_text = body.get("clause_text", "")
        risk_description = body.get("risk_description", "")

        if not clause_text or not risk_description:
            raise HTTPException(
                status_code=400,
                detail="Both clause_text and risk_description are required"
            )

        logger.info("Received streaming remediation request (clause length: %d chars)", len(clause_text))

        async def event_generator():
            """Generate SSE events as the remediation graph executes."""
            try:
                # Initialize state
                initial_state = {
                    "original_clause": clause_text,
                    "risk_description": risk_description,
                    "draft": "",
                    "thinking": "",
                    "rationale": "",
                    "messages": []
                }

                # Stream: Creator starting
                yield f"event: agent_start\ndata: {json.dumps({'agent': 'creator', 'message': 'Draftsman analyzing clause...'})}\n\n"
                await asyncio.sleep(0.1)

                # Accumulate state across all nodes
                accumulated_state = initial_state.copy()

                # Run the graph with streaming
                async for event in remediation_graph.astream(initial_state):
                    logger.debug(f"Graph event: {event}")

                    # Check if creator completed
                    if "creator" in event:
                        # Merge creator's updates into accumulated state
                        creator_update = event["creator"]
                        accumulated_state["draft"] = creator_update.get("draft", accumulated_state.get("draft", ""))
                        accumulated_state["rationale"] = creator_update.get("rationale", accumulated_state.get("rationale", ""))

                        if creator_update.get("draft"):
                            draft = creator_update["draft"]
                            yield f"event: agent_progress\ndata: {json.dumps({'agent': 'creator', 'message': 'Crafting safer clause...'})}\n\n"
                            await asyncio.sleep(0.1)
                            yield f"event: agent_complete\ndata: {json.dumps({'agent': 'creator', 'message': 'Draft complete', 'draft_preview': draft[:100] + '...' if len(draft) > 100 else draft})}\n\n"
                            await asyncio.sleep(0.1)

                    # Check if skeptic started
                    if "skeptic" in event:
                        # Merge skeptic's updates into accumulated state
                        skeptic_update = event["skeptic"]
                        accumulated_state["thinking"] = skeptic_update.get("thinking", accumulated_state.get("thinking", ""))

                        yield f"event: agent_start\ndata: {json.dumps({'agent': 'skeptic', 'message': 'Auditor reviewing draft...'})}\n\n"
                        await asyncio.sleep(0.1)
                        yield f"event: agent_progress\ndata: {json.dumps({'agent': 'skeptic', 'message': 'Stress-testing for loopholes...'})}\n\n"
                        await asyncio.sleep(0.1)

                        if skeptic_update.get("thinking"):
                            yield f"event: agent_complete\ndata: {json.dumps({'agent': 'skeptic', 'message': 'Verification complete'})}\n\n"
                            await asyncio.sleep(0.1)

                # Collect final result from accumulated state
                if accumulated_state.get("draft") and accumulated_state.get("thinking"):
                    # Build final rationale
                    full_rationale = f"{accumulated_state.get('rationale', '')}\n\n**Skeptic Verification:**\n{accumulated_state.get('thinking', '')}"

                    final_result = {
                        "original": clause_text,
                        "rewritten": accumulated_state["draft"],
                        "rationale": full_rationale
                    }

                    logger.info(f"Remediation complete. Draft length: {len(accumulated_state['draft'])} chars")
                    yield f"event: complete\ndata: {json.dumps(final_result)}\n\n"
                else:
                    error_msg = f"Incomplete remediation: draft={bool(accumulated_state.get('draft'))}, thinking={bool(accumulated_state.get('thinking'))}"
                    logger.error(error_msg)
                    yield f"event: error\ndata: {json.dumps({'error': error_msg})}\n\n"

            except Exception as e:
                logger.error(f"Error during streaming remediation: {str(e)}")
                import traceback
                traceback.print_exc()
                yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable buffering in nginx
            }
        )

    except Exception as e:
        logger.error("Error setting up remediation stream: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "Quorum Social Brain API",
        "version": "0.2.0",
        "endpoints": {
            "POST /sessions/create": "Create analysis session with human-in-the-loop PII validation",
            "POST /sessions/{id}/approve-pii": "Approve PII and continue to Social Brain analysis",
            "GET /sessions/{id}/state": "Get current session state",
            "POST /pii/preview": "[Legacy] Preview PII redaction",
            "POST /analyze": "[Legacy] Analyze without human validation",
            "POST /remediate": "Remediate a hazardous clause",
            "GET /health": "Health check"
        },
        "workflow": {
            "recommended": [
                "1. POST /sessions/create - Upload document, get detected PII",
                "2. [Frontend] User reviews PII in workbench",
                "3. POST /sessions/{id}/approve-pii - Submit validated PII, get analysis",
                "4. POST /remediate - Fix hazardous clauses (optional)"
            ]
        }
    }
