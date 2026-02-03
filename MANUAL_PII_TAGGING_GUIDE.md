# Manual PII Tagging Guide

## Overview
The PII Validation Workbench allows you to **manually add entities** that the automated detection missed, in addition to dismissing false positives.

---

## How to Add PII Entities Manually

### Step 1: Select Text
- **Mouse drag** to select any text in the document that contains PII
- The text selection will be highlighted
- A floating tagging panel will appear at the bottom of the screen

### Step 2: Choose Entity Type
Click one of the three buttons to tag the selected text:

- **Name** (👤) - For person names, company executives, board members
- **Email** (✉️) - For email addresses
- **Phone** (📞) - For phone numbers

### Step 3: Verify Addition
- The entity will be added to the entity list on the right
- It will show a **green "Manual" badge** to indicate human addition
- It will be highlighted in the document with the appropriate color
- The stats will update to show "Human added" count

---

## Example Use Cases

### Case 1: Machine Missed a Name Variation
**Document contains:**
```
CEO J. Smith will oversee the transaction.
```

**Machine detected:** Nothing (abbreviated names sometimes missed)

**Manual fix:**
1. Select "J. Smith" with mouse
2. Click "Name" button
3. Entity added as `[PERSON_3]` (Manual)

### Case 2: Custom PII Not in Standard Patterns
**Document contains:**
```
Contact our deal desk at deals-team@company.com
```

**Machine detected:** Nothing (non-standard email format)

**Manual fix:**
1. Select "deals-team@company.com"
2. Click "Email" button
3. Entity added as `[EMAIL_ADDRESS_2]` (Manual)

### Case 3: International Phone Number
**Document contains:**
```
Call +44 20 1234 5678 for inquiries.
```

**Machine detected:** Nothing (international format)

**Manual fix:**
1. Select "+44 20 1234 5678"
2. Click "Phone" button
3. Entity added as `[PHONE_NUMBER_1]` (Manual)

---

## Visual Indicators

### Machine-Detected Entity
```
┌─────────────────────────────────┐
│ PERSON                          │
│ "John Smith"                    │
│ Position: 120-131               │
│ Source: machine                 │
│ [Dismiss]                       │
└─────────────────────────────────┘
```

### Human-Added Entity
```
┌─────────────────────────────────┐
│ PERSON    [+ Manual]            │  ← Green badge
│ "J. Smith"                      │
│ Position: 250-259               │
│ Source: human                   │
│ [Dismiss]                       │
└─────────────────────────────────┘
```

---

## Stats Breakdown

After manual additions, the stats card shows:

```
╔═══════════════════════════╗
║  42 Active | 3 Dismissed  ║
║───────────────────────────║
║  Machine: 38              ║
║  Human:    4              ║  ← Your manual additions
╚═══════════════════════════╝
```

---

## Overlap Detection

**Protection:** You cannot tag text that overlaps with an existing entity.

**Example:**
```
Document: "Contact John Smith at john@company.com"
Already tagged: "John Smith" as [PERSON_1]

If you try to select: "John" or "Smith" or "John Smith"
→ Alert: "Selected text overlaps with existing entity"
→ Solution: Dismiss the existing entity first, then retag
```

---

## Telemetry Tracking

Your manual additions are tracked for quality improvement:

- **Dwell time:** How long you spent reviewing
- **Dismissed count:** False positives you removed
- **Added count:** Entities you manually tagged
- **Total corrections:** Dismissed + Added

This data helps build a **data moat** - your human expertise trains better PII models.

---

## Tips for Effective Manual Tagging

1. **Be Conservative:** Only tag entities that truly need masking
2. **Check Context:** Verify the text is actually PII, not just looks like it
3. **Use Proper Type:**
   - Use "Name" for people (not companies)
   - Use "Email" for email addresses only
   - Use "Phone" for phone numbers only
4. **Review Before Approve:** Check the entity list to ensure all additions are correct

---

## Keyboard Shortcuts

Currently not implemented, but planned:
- `Cmd/Ctrl + 1` - Tag as Name
- `Cmd/Ctrl + 2` - Tag as Email
- `Cmd/Ctrl + 3` - Tag as Phone
- `Esc` - Clear selection

---

## Workflow Summary

```
┌──────────────┐
│ Upload Doc   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Auto-Detect  │ ← Machine finds PII
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│ Human Review in Workbench    │
│                              │
│ • Dismiss false positives    │ ← Remove incorrect detections
│ • Add missed entities        │ ← SELECT text + TAG type
│                              │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────┐
│ Approve      │ ← Final validated list
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Pseudonymize │ ← Mask with [PERSON_1] etc.
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ AI Analysis  │ ← Social Brain processes masked doc
└──────────────┘
```

---

## Technical Details

### Entity Structure
```typescript
interface PIIEntity {
  entity_type: "PERSON" | "EMAIL_ADDRESS" | "PHONE_NUMBER";
  start: number;        // Character offset
  end: number;          // Character offset
  text: string;         // Original text
  confidence: number;   // 1.0 for human, 0.0-1.0 for machine
  pseudo_id: string;    // "[PERSON_1]", "[EMAIL_1]", etc.
  source: "machine" | "human";
  dismissed: boolean;
}
```

### Pseudonym Generation
- **Machine entities:** `[ENTITY_TYPE_N]` where N is auto-incremented
- **Human entities:** Same format, continues numbering after machine entities
- **Unique per type:** `[PERSON_1]`, `[PERSON_2]`, `[EMAIL_1]`, etc.

---

## Questions?

- For issues, file at: https://github.com/anthropics/quorum-mvp/issues
- For feature requests, use the "Manual Tagging" label

**Last Updated:** 2026-01-28
