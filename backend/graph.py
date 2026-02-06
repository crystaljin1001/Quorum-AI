"""
Social Brain LangGraph Implementation.

This module implements the three-agent workflow using LangGraph StateGraph:
- The Creator (Claude 3.5 Sonnet)
- The Skeptic (DeepSeek API)
- The Optimizer (GPT-4o-mini)
"""

import os
import json
from typing import TypedDict, Annotated
import operator

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .prompts import CREATOR_PROMPT, SKEPTIC_PROMPT, OPTIMIZER_PROMPT
from .core.scoring import calculate_conflict_score, get_primary_threat


class GraphState(TypedDict):
    """State that flows through the Social Brain graph."""
    document: str  # The original contract/document text
    creator_summary: str  # The Creator's draft summary
    skeptic_critique: str  # The Skeptic's risk analysis
    final_output: str  # The Optimizer's final JSON output
    messages: Annotated[list, operator.add]  # Message history


# Initialize the LLM clients
def get_creator_llm():
    """The Creator uses Claude 3 Haiku via Anthropic."""
    return ChatAnthropic(
        model="claude-3-haiku-20240307",
        api_key=os.getenv("ANTHROPIC_API_KEY"),
    )


def get_skeptic_llm():
    """The Skeptic uses DeepSeek R1 API via OpenAI-compatible endpoint."""
    return ChatOpenAI(
        model="deepseek-reasoner",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://api.deepseek.com",
    )


def get_optimizer_llm():
    """The Optimizer uses GPT-4o-mini via OpenAI."""
    return ChatOpenAI(
        model="gpt-4o-mini",
        api_key=os.getenv("OPENAI_API_KEY"),
    )


# Node functions
def creator_node(state: GraphState) -> GraphState:
    """The Creator drafts a comprehensive summary of the contract."""
    llm = get_creator_llm()

    messages = [
        SystemMessage(content=CREATOR_PROMPT),
        HumanMessage(content=f"Please analyze and summarize the following contract:\n\n{state['document']}")
    ]

    response = llm.invoke(messages)

    return {
        "creator_summary": response.content,
        "messages": [{"role": "creator", "content": response.content}]
    }


def skeptic_node(state: GraphState) -> GraphState:
    """The Skeptic finds flaws and risks in the Creator's summary."""
    llm = get_skeptic_llm()

    messages = [
        SystemMessage(content=SKEPTIC_PROMPT),
        HumanMessage(content=f"""Original Contract:
{state['document']}

The Creator's Summary:
{state['creator_summary']}

Find all risks and loopholes in this analysis.""")
    ]

    response = llm.invoke(messages)

    return {
        "skeptic_critique": response.content,
        "messages": [{"role": "skeptic", "content": response.content}]
    }


def optimizer_node(state: GraphState) -> GraphState:
    """The Optimizer synthesizes and outputs final JSON with conflict_score."""
    llm = get_optimizer_llm()

    messages = [
        SystemMessage(content=OPTIMIZER_PROMPT),
        HumanMessage(content=f"""Original Contract:
{state['document']}

The Creator's Draft Summary:
{state['creator_summary']}

The Skeptic's Critique:
{state['skeptic_critique']}

Please provide your final assessment as JSON.""")
    ]

    response = llm.invoke(messages)

    # Parse the LLM's JSON output
    try:
        # Handle JSON in code blocks
        content = response.content
        if '```json' in content:
            json_match = content.split('```json')[1].split('```')[0]
            optimizer_output = json.loads(json_match)
        else:
            optimizer_output = json.loads(content)

        # Calculate conflict score using hybrid formula
        score_result = calculate_conflict_score(
            article_breakdown=optimizer_output.get('article_breakdown', []),
            critical_omissions=optimizer_output.get('critical_omissions', []),
            skeptic_critique=state['skeptic_critique']
        )

        # Get primary threat
        primary_threat = get_primary_threat(
            article_breakdown=optimizer_output.get('article_breakdown', []),
            critical_omissions=optimizer_output.get('critical_omissions', [])
        )

        # Replace LLM's score with calculated score
        optimizer_output['conflict_analysis'] = {
            'score': score_result['score'],
            'raw_score': score_result['raw_score'],
            'risk_level': score_result['risk_level'],
            'primary_threat': primary_threat,
            'score_breakdown': score_result['breakdown'],
            'counts': score_result['counts'],
            'formula': score_result['formula']
        }

        # Convert back to JSON string
        final_output = json.dumps(optimizer_output, indent=2)

    except (json.JSONDecodeError, KeyError) as e:
        # Fallback: return original output if parsing fails
        print(f"Warning: Could not parse optimizer output for scoring: {e}")
        final_output = response.content

    return {
        "final_output": final_output,
        "messages": [{"role": "optimizer", "content": final_output}]
    }


def build_social_brain_graph() -> StateGraph:
    """Build and return the Social Brain workflow graph."""
    workflow = StateGraph(GraphState)

    # Add nodes
    workflow.add_node("creator", creator_node)
    workflow.add_node("skeptic", skeptic_node)
    workflow.add_node("optimizer", optimizer_node)

    # Define the flow: Creator -> Skeptic -> Optimizer -> END
    workflow.set_entry_point("creator")
    workflow.add_edge("creator", "skeptic")
    workflow.add_edge("skeptic", "optimizer")
    workflow.add_edge("optimizer", END)

    return workflow.compile()


# Create the compiled graph
social_brain = build_social_brain_graph()


async def analyze_document(document: str) -> dict:
    """
    Run a document through the Social Brain analysis pipeline.

    Args:
        document: The contract text to analyze

    Returns:
        dict containing creator_summary, skeptic_critique, and final_output
    """
    initial_state = {
        "document": document,
        "creator_summary": "",
        "skeptic_critique": "",
        "final_output": "",
        "messages": []
    }

    result = await social_brain.ainvoke(initial_state)

    return {
        "creator_summary": result["creator_summary"],
        "skeptic_critique": result["skeptic_critique"],
        "final_output": result["final_output"],
        "messages": result["messages"]
    }


# ============================================================================
# REMEDIATION GRAPH WITH STREAMING SUPPORT
# ============================================================================

class RemediationState(TypedDict):
    """State for the remediation workflow."""
    original_clause: str
    risk_description: str
    draft: str  # Creator's rewritten clause
    thinking: str  # Skeptic's verification analysis
    rationale: str  # Creator's explanation
    messages: Annotated[list, operator.add]


def remediation_creator_node(state: RemediationState) -> RemediationState:
    """Creator drafts a safer version of the clause."""
    llm = get_creator_llm()

    prompt = f"""You are a legal expert specializing in contract remediation.
Your task is to rewrite a hazardous contract clause to mitigate identified risks while maintaining the core business intent.

**Original Clause:**
{state['original_clause']}

**Identified Risk:**
{state['risk_description']}

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

    messages = [
        SystemMessage(content="You are an expert legal contract drafter."),
        HumanMessage(content=prompt)
    ]

    response = llm.invoke(messages)
    content = response.content

    # Parse response
    draft = ""
    rationale = ""

    if "REWRITTEN CLAUSE:" in content and "RATIONALE:" in content:
        parts = content.split("RATIONALE:")
        draft = parts[0].replace("REWRITTEN CLAUSE:", "").strip()
        rationale = parts[1].strip()
    else:
        draft = content
        rationale = "Clause has been rewritten to address identified risks."

    return {
        "draft": draft,
        "rationale": rationale,
        "messages": [{"role": "creator", "content": "Drafting safer clause..."}]
    }


def remediation_skeptic_node(state: RemediationState) -> RemediationState:
    """Skeptic verifies the rewritten clause addresses the risks."""
    llm = get_skeptic_llm()

    prompt = f"""You are a skeptical legal analyst. Your job is to verify whether a rewritten contract clause actually mitigates the identified risk.

**Original Clause:**
{state['original_clause']}

**Identified Risk:**
{state['risk_description']}

**Proposed Rewrite:**
{state['draft']}

**Your Task:**
Analyze whether the rewritten clause adequately addresses the risk. Look for:
1. Does it actually fix the identified problem?
2. Does it introduce any new risks?
3. Is the language clear and enforceable?
4. Are there any remaining loopholes?

Provide a brief assessment (2-3 sentences) on whether this rewrite successfully mitigates the risk."""

    messages = [
        SystemMessage(content="You are a skeptical legal risk analyst."),
        HumanMessage(content=prompt)
    ]

    response = llm.invoke(messages)

    return {
        "thinking": response.content,
        "messages": [{"role": "skeptic", "content": "Stress-testing for loopholes..."}]
    }


def build_remediation_graph() -> StateGraph:
    """Build the remediation workflow graph."""
    workflow = StateGraph(RemediationState)

    workflow.add_node("creator", remediation_creator_node)
    workflow.add_node("skeptic", remediation_skeptic_node)

    workflow.set_entry_point("creator")
    workflow.add_edge("creator", "skeptic")
    workflow.add_edge("skeptic", END)

    return workflow.compile()


# Create the compiled remediation graph
remediation_graph = build_remediation_graph()
