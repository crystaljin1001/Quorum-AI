"""
PIIEngine: Core PII detection and reversible pseudonymization engine.

Uses Microsoft Presidio for automated detection and provides human-in-the-loop
validation with reversible pseudonym mappings.
"""

from typing import List, Dict, Tuple
from collections import defaultdict
from dataclasses import dataclass, asdict
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider


@dataclass
class PIIEntity:
    """Represents a detected or manually-tagged PII entity."""
    entity_type: str        # "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER"
    start: int              # Character offset start
    end: int                # Character offset end
    text: str               # Original text
    confidence: float       # 0.0-1.0 (1.0 for human-tagged)
    pseudo_id: str          # "[PERSON_1]", "[EMAIL_1]", etc.
    source: str             # "machine" | "human"
    dismissed: bool = False # User dismissed this detection

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class PIIEngine:
    """
    Core PII detection and pseudonymization engine.

    Features:
    - Detects PII with character offsets using Presidio
    - Reversible pseudonymization with bidirectional mapping
    - Manual override support (human corrections get confidence=1.0)
    - Session-based mapping storage for deanonymization
    """

    # Entity types to detect
    ENTITY_TYPES = ["PERSON", "PHONE_NUMBER", "EMAIL_ADDRESS"]

    def __init__(self, session_id: str):
        """
        Initialize PII engine for a specific session.

        Args:
            session_id: Unique session identifier for mapping isolation
        """
        self.session_id = session_id

        # Initialize Presidio analyzer
        nlp_config = {
            "nlp_engine_name": "spacy",
            "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
        }
        nlp_engine = NlpEngineProvider(nlp_configuration=nlp_config).create_engine()
        self.analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en"])

        # Bidirectional mapping for reversible pseudonymization
        self.pseudo_to_original: Dict[str, str] = {}  # "[PERSON_1]" -> "John Smith"
        self.original_to_pseudo: Dict[str, str] = {}  # "John Smith" -> "[PERSON_1]"

        # Entity counters for generating unique pseudonyms
        self.entity_counters: Dict[str, int] = defaultdict(int)

    def detect(self, text: str) -> List[PIIEntity]:
        """
        Run automated PII detection on text.

        Args:
            text: Document text to analyze

        Returns:
            List of PIIEntity objects with character offsets
        """
        # Run Presidio analysis
        results = self.analyzer.analyze(
            text=text,
            entities=self.ENTITY_TYPES,
            language="en"
        )

        # Convert to PIIEntity objects
        entities = []
        for result in results:
            entity_text = text[result.start:result.end]

            # Generate or retrieve pseudonym
            pseudo_id = self._generate_pseudonym(result.entity_type, entity_text)

            entity = PIIEntity(
                entity_type=result.entity_type,
                start=result.start,
                end=result.end,
                text=entity_text,
                confidence=result.score,
                pseudo_id=pseudo_id,
                source="machine",
                dismissed=False
            )
            entities.append(entity)

        return entities

    def merge_manual_entities(
        self,
        machine_entities: List[PIIEntity],
        manual_entities: List[Dict]
    ) -> List[PIIEntity]:
        """
        Merge manual user selections with machine detections.

        Manual entities override machine detections at the same offsets.
        Human selections get confidence=1.0.

        Args:
            machine_entities: Automated detections
            manual_entities: User-added entities from workbench

        Returns:
            Merged list with human overrides prioritized
        """
        # Convert manual dicts to PIIEntity objects
        manual_pii = []
        for m in manual_entities:
            pseudo_id = self._generate_pseudonym(m["entity_type"], m["text"])
            entity = PIIEntity(
                entity_type=m["entity_type"],
                start=m["start"],
                end=m["end"],
                text=m["text"],
                confidence=1.0,  # Human override
                pseudo_id=pseudo_id,
                source="human",
                dismissed=m.get("dismissed", False)
            )
            manual_pii.append(entity)

        # Remove machine entities that overlap with manual ones
        filtered_machine = []
        for machine in machine_entities:
            overlaps = False
            for manual in manual_pii:
                if self._ranges_overlap(
                    machine.start, machine.end,
                    manual.start, manual.end
                ):
                    overlaps = True
                    break
            if not overlaps and not machine.dismissed:
                filtered_machine.append(machine)

        # Combine and sort by start position
        all_entities = filtered_machine + manual_pii
        all_entities.sort(key=lambda e: e.start)

        return all_entities

    def pseudonymize(self, text: str, entities: List[PIIEntity]) -> Tuple[str, Dict]:
        """
        Replace PII in text with pseudonyms.

        Args:
            text: Original document text
            entities: PII entities to mask

        Returns:
            Tuple of (masked_text, mapping_dict)
            mapping_dict format: {pseudo_id: original_text}
        """
        # Filter out dismissed entities
        active_entities = [e for e in entities if not e.dismissed]

        # Sort by start position (descending) for safe replacement
        sorted_entities = sorted(active_entities, key=lambda e: e.start, reverse=True)

        # Replace entities with pseudonyms
        masked_text = text
        for entity in sorted_entities:
            masked_text = (
                masked_text[:entity.start] +
                entity.pseudo_id +
                masked_text[entity.end:]
            )

            # Update mapping
            self.pseudo_to_original[entity.pseudo_id] = entity.text
            self.original_to_pseudo[entity.text] = entity.pseudo_id

        return masked_text, self.pseudo_to_original.copy()

    def deanonymize(self, masked_text: str) -> str:
        """
        Reverse pseudonyms back to original text.

        Args:
            masked_text: Text with pseudonyms

        Returns:
            Original text with PII restored
        """
        result = masked_text
        for pseudo_id, original_text in self.pseudo_to_original.items():
            result = result.replace(pseudo_id, original_text)
        return result

    def get_redaction_summary(self, entities: List[PIIEntity]) -> Dict[str, int]:
        """
        Generate summary of redacted entities by type.

        Args:
            entities: List of PII entities

        Returns:
            Dict with friendly names: {"Names": 14, "Email Addresses": 3}
        """
        active_entities = [e for e in entities if not e.dismissed]
        counts = defaultdict(int)

        for entity in active_entities:
            counts[entity.entity_type] += 1

        # Convert to friendly names
        friendly_names = {
            "PERSON": "Names",
            "EMAIL_ADDRESS": "Email Addresses",
            "PHONE_NUMBER": "Phone Numbers"
        }

        summary = {}
        for entity_type, count in counts.items():
            friendly_name = friendly_names.get(entity_type, entity_type)
            summary[friendly_name] = count

        return summary

    def _generate_pseudonym(self, entity_type: str, text: str) -> str:
        """
        Generate unique pseudonym for an entity.

        Reuses existing pseudonym if same text seen before.

        Args:
            entity_type: Type of entity (PERSON, EMAIL_ADDRESS, etc.)
            text: Original text

        Returns:
            Pseudonym string like "[PERSON_1]"
        """
        # Check if we've seen this text before
        if text in self.original_to_pseudo:
            return self.original_to_pseudo[text]

        # Generate new pseudonym
        self.entity_counters[entity_type] += 1
        pseudo_id = f"[{entity_type}_{self.entity_counters[entity_type]}]"

        # Store mapping
        self.pseudo_to_original[pseudo_id] = text
        self.original_to_pseudo[text] = pseudo_id

        return pseudo_id

    def _ranges_overlap(self, start1: int, end1: int, start2: int, end2: int) -> bool:
        """Check if two character ranges overlap."""
        return start1 < end2 and start2 < end1

    def save_mapping(self) -> Dict:
        """
        Export mapping for storage.

        Returns:
            Dict with session_id and mappings
        """
        return {
            "session_id": self.session_id,
            "pseudo_to_original": self.pseudo_to_original,
            "original_to_pseudo": self.original_to_pseudo,
            "entity_counters": dict(self.entity_counters)
        }

    def load_mapping(self, mapping_data: Dict):
        """
        Load mapping from storage.

        Args:
            mapping_data: Dict from save_mapping()
        """
        self.pseudo_to_original = mapping_data.get("pseudo_to_original", {})
        self.original_to_pseudo = mapping_data.get("original_to_pseudo", {})
        self.entity_counters = defaultdict(int, mapping_data.get("entity_counters", {}))
