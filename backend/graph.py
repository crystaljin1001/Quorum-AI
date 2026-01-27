"""
Social Brain LangGraph Implementation.

This module implements the three-agent workflow using LangGraph StateGraph:
- The Creator (Claude 3.5 Sonnet)
- The Skeptic (DeepSeek API)
- The Optimizer (GPT-4o-mini)
"""

import os
from typing import TypedDict, Annotated
import operator

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from .prompts import CREATOR_PROMPT, SKEPTIC_PROMPT, OPTIMIZER_PROMPT


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

    return {
        "final_output": response.content,
        "messages": [{"role": "optimizer", "content": response.content}]
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
