# Conflict Score Calculation Formula

## Overview

The Conflict Score is a deterministic, explainable metric that measures the intensity of conflict between the Creator (draftsman) and Skeptic (auditor) agents in Quorum's Social Brain.

**Key Benefits:**
- ✅ **Deterministic:** Same contract = Same score every time
- ✅ **Explainable:** Clear formula, no black-box AI
- ✅ **Investor-Friendly:** Can be audited and validated
- ✅ **Multi-Signal:** Combines structured + unstructured analysis

---

## Formula

```
Conflict Score = (Hazardous × 20) + (Warnings × 8) + (Omissions × 15) +
                 (Keyword Intensity × 2) + (Risks Enumerated × 3)

Capped at 100
```

---

## Components Breakdown

### 1. **Hazardous Clauses** (Weight: 20)
- Count of clauses marked as "Hazardous" by the Optimizer
- These are deal-breaking risks requiring immediate remediation
- **Example:** Asymmetric termination fees, unlimited liability

### 2. **Warning Clauses** (Weight: 8)
- Count of clauses marked as "Warning" by the Optimizer
- Suboptimal provisions that should be negotiated
- **Example:** Outdated thresholds, weak protections

### 3. **Critical Omissions** (Weight: 15)
- Count of missing safeguards identified by the Skeptic
- Standard protections absent from the contract
- **Example:** Missing Fiduciary Out, no Qualified Offer exception

### 4. **Keyword Intensity** (Weight: 2)
- NLP analysis of Skeptic's raw critique text
- Weighted count of danger keywords (critical, trap, asymmetric, etc.)
- Measures how "alarmed" the Skeptic is

### 5. **Risks Enumerated** (Weight: 3)
- Number of bullet points in Skeptic's critique
- Indicates how many distinct issues were found
- More bullets = more comprehensive risk identification

---

## Risk Level Thresholds

| Score Range | Risk Level | Interpretation |
|-------------|------------|----------------|
| 0-24        | **Low**    | Minimal conflict, standard terms |
| 25-49       | **Medium** | Some concerns, review recommended |
| 50-74       | **High**   | Significant issues, negotiation needed |
| 75-100      | **Critical** | Deal-breaking risks, major remediation required |

---

## Example Calculation

### Scenario: M&A Agreement with $25M Termination Fee Trap

**Inputs:**
- Hazardous Clauses: 4 (Adverse Person, Flip-In, Amendment, Termination)
- Warning Clauses: 4 (Threshold, Redemption, Exchange, Duration)
- Critical Omissions: 2 (Fiduciary Out, TIDE)
- Keyword Intensity: 12.5 (counts of "critical", "trap", "asymmetric", etc.)
- Risks Enumerated: 8 (bullet points in Skeptic critique)

**Calculation:**
```
Score = (4 × 20) + (4 × 8) + (2 × 15) + (12.5 × 2) + (8 × 3)
      = 80 + 32 + 30 + 25 + 24
      = 191
      = 100 (capped)
```

**Result:** Score = 100/100, Risk Level = **Critical**

---

## Implementation

### Backend (`backend/core/scoring.py`)

```python
def calculate_conflict_score(
    article_breakdown: List[Dict[str, Any]],
    critical_omissions: List[Dict[str, Any]],
    skeptic_critique: str
) -> Dict[str, Any]:
    """
    Calculate comprehensive conflict score using multiple signals.
    Returns score, risk_level, breakdown, and formula metadata.
    """
    # Count structured findings
    hazardous = sum(1 for item in article_breakdown if item['status'] == 'Hazardous')
    warnings = sum(1 for item in article_breakdown if item['status'] == 'Warning')
    omissions = len(critical_omissions)

    # NLP analysis
    nlp_analysis = calculate_skeptic_intensity_nlp(skeptic_critique)

    # Weighted calculation
    score_breakdown = {
        'hazardous_clauses': hazardous * 20,
        'warning_clauses': warnings * 8,
        'critical_omissions': omissions * 15,
        'keyword_intensity': nlp_analysis['keyword_score'] * 2,
        'risks_enumerated': nlp_analysis['risks_enumerated'] * 3
    }

    total = min(sum(score_breakdown.values()), 100)

    # Return comprehensive result
    return {
        'score': total,
        'risk_level': determine_risk_level(total),
        'breakdown': score_breakdown,
        'formula': {...}
    }
```

### Integration (`backend/graph.py`)

The Optimizer node now:
1. Gets the LLM's structured output (article_breakdown, omissions)
2. Calculates the score using the hybrid formula
3. Replaces the LLM's subjective score with the calculated score
4. Returns JSON with formula breakdown

### Frontend Display (`frontend/src/app/report/page.tsx`)

The Conflict Score card includes:
- **Info Icon (ℹ️)** next to "Conflict Score" header
- **Hover Popover** showing:
  - Formula explanation
  - Your specific score breakdown
  - Component values (e.g., "4 Hazardous × 20 = 80")
  - Total calculation
  - "Deterministic & Explainable" badge

---

## User Experience

### How Users See the Formula

1. **Main Dashboard:**
   - Shows score: `85/100`
   - Shows risk level badge: `Critical`

2. **Click Info Icon:**
   - **Formula:** `Score = (Hazardous × 20) + (Warnings × 8) + ...`
   - **Your Breakdown:**
     ```
     Hazardous Clauses:    4 × 20 = 80
     Warning Clauses:      4 × 8  = 32
     Critical Omissions:   2 × 15 = 30
     Keyword Intensity:           25
     Risks Enumerated:            24
     ─────────────────────────────────
     Total Score:               100/100
     ```
   - **Note:** "Deterministic & Explainable: Same contract always produces the same score."

### Non-Confusing Design Principles

✅ **Progressive Disclosure:** Formula hidden by default, shown on hover
✅ **Plain Language:** Uses "Hazardous Clauses" not "H × W_h"
✅ **Real Numbers:** Shows actual values from user's analysis
✅ **Visual Hierarchy:** Score is prominent, formula is secondary
✅ **Trustworthy:** Explains it's not AI-generated

---

## Advantages Over LLM-Determined Scores

| Aspect | LLM Score (Old) | Hybrid Formula (New) |
|--------|----------------|----------------------|
| **Consistency** | ❌ Varies per run | ✅ Deterministic |
| **Explainability** | ❌ Black box | ✅ Full breakdown |
| **Auditability** | ❌ Can't verify | ✅ Reproducible |
| **Trust** | ❌ "AI magic" | ✅ Mathematical |
| **Tuning** | ❌ Requires retraining | ✅ Adjust weights |
| **Investor Confidence** | ❌ Skeptical | ✅ Transparent |

---

## Future Enhancements

### Phase 2: Data-Driven Weights
- Collect 100+ contract analyses
- Run regression to optimize weights
- Update formula based on real-world outcomes

### Phase 3: Custom Scoring
- Allow enterprise clients to customize weights
- Industry-specific scoring (Tech M&A vs Real Estate)
- Client-specific risk profiles

---

## Testing & Validation

### Unit Tests (`backend/tests/test_scoring.py`)
```python
def test_conflict_score_deterministic():
    """Ensure same input produces same score."""
    result1 = calculate_conflict_score(...)
    result2 = calculate_conflict_score(...)
    assert result1['score'] == result2['score']

def test_conflict_score_capped_at_100():
    """Ensure score never exceeds 100."""
    result = calculate_conflict_score(...)
    assert result['score'] <= 100
```

---

## Technical Notes

- **NLP Keywords:** Defined in `DANGER_KEYWORDS` dict with weights
- **Bullet Point Detection:** Regex `r'^\s*[-*•]\s'`
- **Risk Level Mapping:** Hardcoded thresholds (25, 50, 75)
- **JSON Export:** Formula included in API response for transparency

---

**Last Updated:** February 3, 2026
**Module:** `backend/core/scoring.py`
**UI Integration:** `frontend/src/app/report/page.tsx`
