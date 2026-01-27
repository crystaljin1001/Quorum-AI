"""Backend module for Quorum MVP - Social Brain document analysis."""

from .prompts import CREATOR_PROMPT, SKEPTIC_PROMPT, OPTIMIZER_PROMPT
from .graph import social_brain, analyze_document

__all__ = [
    "CREATOR_PROMPT",
    "SKEPTIC_PROMPT",
    "OPTIMIZER_PROMPT",
    "social_brain",
    "analyze_document",
]
