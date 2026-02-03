"""
Session storage for human-in-the-loop PII workflow.

Stores session state including:
- Original document text
- Detected PII entities
- User validation status
- PII mapping dictionaries
"""

from typing import Dict, Optional, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SessionStore:
    """
    In-memory session storage.

    TODO: Migrate to database persistence for production.
    """

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(
        self,
        session_id: str,
        document: str,
        detected_entities: List[Dict],
        pii_mapping: Dict
    ) -> Dict:
        """
        Create a new session.

        Args:
            session_id: Unique session identifier
            document: Original document text (NEVER exposed to LLMs)
            detected_entities: List of PIIEntity dicts
            pii_mapping: Pseudonym mapping dictionary

        Returns:
            Session data dict
        """
        session = {
            "session_id": session_id,
            "document": document,
            "masked_document": None,
            "detected_entities": detected_entities,
            "pii_mapping": pii_mapping,
            "pii_approved": False,
            "status": "awaiting_pii_review",
            "creator_summary": None,
            "skeptic_critique": None,
            "final_output": None,
            "telemetry": {
                "pii_dwell_time_ms": 0,
                "manual_corrections": 0,
                "dismissed_count": 0,
                "added_count": 0
            },
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        self._sessions[session_id] = session
        logger.info(f"Created session {session_id} with {len(detected_entities)} detected entities")

        return session

    def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Retrieve session by ID.

        Args:
            session_id: Session identifier

        Returns:
            Session data dict or None if not found
        """
        return self._sessions.get(session_id)

    def update_session(self, session_id: str, updates: Dict) -> bool:
        """
        Update session fields.

        Args:
            session_id: Session identifier
            updates: Dict of fields to update

        Returns:
            True if successful, False if session not found
        """
        session = self._sessions.get(session_id)
        if not session:
            logger.warning(f"Session {session_id} not found for update")
            return False

        session.update(updates)
        session["updated_at"] = datetime.now().isoformat()

        logger.info(f"Updated session {session_id}: {list(updates.keys())}")
        return True

    def approve_pii(
        self,
        session_id: str,
        validated_entities: List[Dict],
        masked_document: str,
        pii_mapping: Dict,
        telemetry: Dict
    ) -> bool:
        """
        Mark PII as approved and store validated entities.

        Args:
            session_id: Session identifier
            validated_entities: User-validated PIIEntity dicts
            masked_document: Pseudonymized document text
            pii_mapping: Updated mapping dictionary
            telemetry: Telemetry data from frontend

        Returns:
            True if successful
        """
        updates = {
            "detected_entities": validated_entities,
            "masked_document": masked_document,
            "pii_mapping": pii_mapping,
            "pii_approved": True,
            "status": "pii_approved",
            "telemetry": telemetry
        }

        return self.update_session(session_id, updates)

    def set_analysis_results(
        self,
        session_id: str,
        creator_summary: str,
        skeptic_critique: str,
        final_output: str
    ) -> bool:
        """
        Store analysis results from Social Brain workflow.

        Args:
            session_id: Session identifier
            creator_summary: Creator agent output
            skeptic_critique: Skeptic agent output
            final_output: Optimizer agent output

        Returns:
            True if successful
        """
        updates = {
            "creator_summary": creator_summary,
            "skeptic_critique": skeptic_critique,
            "final_output": final_output,
            "status": "complete"
        }

        return self.update_session(session_id, updates)

    def delete_session(self, session_id: str) -> bool:
        """
        Delete a session.

        Args:
            session_id: Session identifier

        Returns:
            True if deleted, False if not found
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info(f"Deleted session {session_id}")
            return True
        return False

    def list_sessions(self) -> List[Dict]:
        """
        List all sessions (for debugging).

        Returns:
            List of session summary dicts
        """
        return [
            {
                "session_id": s["session_id"],
                "status": s["status"],
                "pii_approved": s["pii_approved"],
                "created_at": s["created_at"]
            }
            for s in self._sessions.values()
        ]

    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """
        Remove sessions older than max_age_hours.

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            Number of sessions deleted
        """
        # TODO: Implement cleanup logic
        pass


# Global session store instance
session_store = SessionStore()
