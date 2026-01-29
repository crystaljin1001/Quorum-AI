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


def redact_pii(text: str) -> tuple[str, int]:
    """
    Privacy Airlock: Detect and redact PII from text.

    Detects PERSON, PHONE_NUMBER, and EMAIL_ADDRESS entities
    and replaces them with numbered placeholders like <PERSON_1>, <EMAIL_2>.

    Args:
        text: The input text to redact

    Returns:
        tuple: (redacted_text, count_of_entities_redacted)
    """
    # Analyze text for PII entities
    results = analyzer.analyze(
        text=text,
        entities=PII_ENTITIES,
        language="en"
    )

    if not results:
        return text, 0

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

    return redacted_text, entity_count


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
        redacted_text, entity_count = redact_pii(document_text)
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
        "version": "0.1.0",
        "endpoints": {
            "POST /analyze": "Analyze a document through the Social Brain pipeline",
            "POST /remediate": "Remediate a hazardous clause",
            "GET /health": "Health check"
        }
    }
