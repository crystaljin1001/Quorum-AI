"""
Conflict Score Calculation for Quorum Social Brain.

Implements a deterministic, explainable scoring system that measures
the intensity of conflict between Creator and Skeptic agents.
"""

import re
from typing import Dict, List, Any


# Keyword weights for NLP analysis
DANGER_KEYWORDS = {
    'critical': 3,
    'fatal': 3,
    'hazardous': 3,
    'trap': 2.5,
    'asymmetric': 2,
    'unlimited': 2,
    'unilateral': 2,
    'missing': 1.5,
    'loophole': 2,
    'breach': 1,
    'liability': 1,
    'risk': 0.5,
    'adverse': 1,
    'termination': 1,
    'indemnity': 1,
    'material': 0.5
}


def calculate_skeptic_intensity_nlp(skeptic_critique: str) -> Dict[str, float]:
    """
    Analyze Skeptic's raw critique for intensity signals using NLP.

    Args:
        skeptic_critique: The raw text output from the Skeptic agent

    Returns:
        Dictionary with keyword_score, risks_enumerated, emphasis_level, and critique_length
    """
    text_lower = skeptic_critique.lower()

    # Count danger keywords
    keyword_score = sum(
        text_lower.count(word) * weight
        for word, weight in DANGER_KEYWORDS.items()
    )

    # Count bullet points (risks enumerated)
    bullet_points = len(re.findall(r'^\s*[-*•]\s', skeptic_critique, re.MULTILINE))

    # Count exclamation marks (emphasis)
    exclamations = skeptic_critique.count('!')

    # Count words (longer critique = more issues)
    word_count = len(skeptic_critique.split())

    return {
        'keyword_score': keyword_score,
        'risks_enumerated': bullet_points,
        'emphasis_level': exclamations,
        'critique_length': word_count
    }


def calculate_conflict_score(
    article_breakdown: List[Dict[str, Any]],
    critical_omissions: List[Dict[str, Any]],
    skeptic_critique: str
) -> Dict[str, Any]:
    """
    Calculate comprehensive conflict score using multiple signals.

    This is the production scoring formula that combines:
    1. Structured findings (Hazardous/Warning clauses, Omissions)
    2. NLP analysis of Skeptic's raw critique

    Formula:
        Score = (Hazardous × 20) + (Warnings × 8) + (Omissions × 15) +
                (Keyword Intensity × 2) + (Risks Enumerated × 3)
        Capped at 100

    Args:
        article_breakdown: List of analyzed clauses with status (Safe/Warning/Hazardous)
        critical_omissions: List of missing safeguards
        skeptic_critique: Raw Skeptic agent output text

    Returns:
        Dictionary with score, risk_level, breakdown, and metrics
    """
    # 1. Count structured findings
    hazardous = sum(1 for item in article_breakdown if item.get('status') == 'Hazardous')
    warnings = sum(1 for item in article_breakdown if item.get('status') == 'Warning')
    omissions = len(critical_omissions)

    # 2. NLP analysis of raw Skeptic text
    nlp_analysis = calculate_skeptic_intensity_nlp(skeptic_critique)

    # 3. Calculate weighted score components
    score_breakdown = {
        'hazardous_clauses': hazardous * 20,
        'warning_clauses': warnings * 8,
        'critical_omissions': omissions * 15,
        'keyword_intensity': nlp_analysis['keyword_score'] * 2,
        'risks_enumerated': nlp_analysis['risks_enumerated'] * 3
    }

    # Total and cap at 100
    total_score = sum(score_breakdown.values())
    capped_score = min(int(total_score), 100)

    # Determine risk level
    if capped_score >= 75:
        risk_level = "Critical"
    elif capped_score >= 50:
        risk_level = "High"
    elif capped_score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        'score': capped_score,
        'raw_score': int(total_score),
        'risk_level': risk_level,
        'breakdown': score_breakdown,
        'counts': {
            'hazardous_clauses': hazardous,
            'warning_clauses': warnings,
            'critical_omissions': omissions
        },
        'nlp_metrics': nlp_analysis,
        'formula': {
            'description': 'Conflict Score = (Hazardous × 20) + (Warnings × 8) + (Omissions × 15) + (Keyword Intensity × 2) + (Risks Enumerated × 3)',
            'weights': {
                'hazardous_weight': 20,
                'warning_weight': 8,
                'omission_weight': 15,
                'keyword_weight': 2,
                'enumeration_weight': 3
            }
        }
    }


def get_primary_threat(article_breakdown: List[Dict[str, Any]], critical_omissions: List[Dict[str, Any]]) -> str:
    """
    Identify the primary threat based on findings.

    Returns a concise string describing the main vulnerability.
    """
    # Prioritize Hazardous findings
    hazardous_items = [item for item in article_breakdown if item.get('status') == 'Hazardous']
    if hazardous_items:
        # Return first hazardous risk summary
        return hazardous_items[0].get('risk_summary', 'Hazardous contractual provision')

    # Next, critical omissions
    if critical_omissions:
        return critical_omissions[0].get('missing_provision', 'Critical protection missing')

    # Fallback to warnings
    warning_items = [item for item in article_breakdown if item.get('status') == 'Warning']
    if warning_items:
        return warning_items[0].get('risk_summary', 'Suboptimal contractual provision')

    return "No significant risks identified"
