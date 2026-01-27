"""
FastAPI server for the Quorum Social Brain document analysis.
"""

import os
import logging
from contextlib import asynccontextmanager
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine

from .graph import social_brain

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
async def remediate_clause(request: Request):
    """
    Remediate a hazardous clause.

    Accepts a clause and risk description, uses Creator to draft a safer version,
    and Skeptic to verify the new draft is actually safer.

    Request body should be JSON:
    {
        "clause_text": "The original hazardous clause text...",
        "risk_description": "Description of why this clause is risky..."
    }

    Returns:
    {
        "original": "original clause",
        "rewritten": "safer rewritten clause",
        "rationale": "explanation of changes"
    }
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

        logger.info("Received remediation request for clause (length: %d chars)", len(clause_text))

        # Step 1: Use Creator (Claude) to draft a safer version
        from .graph import get_creator_llm
        from langchain_core.messages import SystemMessage, HumanMessage

        creator_llm = get_creator_llm()

        creator_prompt = f"""You are a legal expert specializing in contract remediation.
Your task is to rewrite a hazardous contract clause to mitigate identified risks while maintaining the core business intent.

**Original Clause:**
{clause_text}

**Identified Risk:**
{risk_description}

**Instructions:**
1. Draft a revised version of this clause that addresses the identified risk
2. Maintain the business purpose but add appropriate safeguards
3. Use clear, unambiguous language
4. Add necessary protections for both parties

Please provide:
1. The rewritten clause (clearly marked)
2. A brief rationale explaining what changes you made and why they mitigate the risk

Format your response as:
REWRITTEN CLAUSE:
[your rewritten clause here]

RATIONALE:
[explanation of changes]"""

        creator_messages = [
            SystemMessage(content="You are an expert legal contract drafter."),
            HumanMessage(content=creator_prompt)
        ]

        logger.info("Creator drafting safer version...")
        creator_response = creator_llm.invoke(creator_messages)
        draft_content = creator_response.content

        # Parse Creator's response
        rewritten = ""
        rationale = ""

        if "REWRITTEN CLAUSE:" in draft_content and "RATIONALE:" in draft_content:
            parts = draft_content.split("RATIONALE:")
            rewritten_section = parts[0].replace("REWRITTEN CLAUSE:", "").strip()
            rationale = parts[1].strip()
            rewritten = rewritten_section
        else:
            # Fallback if format isn't followed
            rewritten = draft_content
            rationale = "Clause has been rewritten to address identified risks."

        logger.info("Creator draft complete (length: %d chars)", len(rewritten))

        # Step 2: Use Skeptic (DeepSeek) to verify the new draft is safer
        from .graph import get_skeptic_llm

        skeptic_llm = get_skeptic_llm()

        skeptic_prompt = f"""You are a skeptical legal analyst. Your job is to verify whether a rewritten contract clause actually mitigates the identified risk.

**Original Clause:**
{clause_text}

**Identified Risk:**
{risk_description}

**Proposed Rewrite:**
{rewritten}

**Your Task:**
Analyze whether the rewritten clause adequately addresses the risk. Look for:
1. Does it actually fix the identified problem?
2. Does it introduce any new risks?
3. Is the language clear and enforceable?
4. Are there any remaining loopholes?

Provide a brief assessment (2-3 sentences) on whether this rewrite successfully mitigates the risk."""

        skeptic_messages = [
            SystemMessage(content="You are a skeptical legal risk analyst."),
            HumanMessage(content=skeptic_prompt)
        ]

        logger.info("Skeptic verifying safety...")
        skeptic_response = skeptic_llm.invoke(skeptic_messages)
        verification = skeptic_response.content

        logger.info("Skeptic verification complete")

        # Append skeptic verification to rationale
        full_rationale = f"{rationale}\n\n**Skeptic Verification:**\n{verification}"

        return {
            "original": clause_text,
            "rewritten": rewritten,
            "rationale": full_rationale
        }

    except Exception as e:
        logger.error("Error during remediation: %s", str(e))
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
