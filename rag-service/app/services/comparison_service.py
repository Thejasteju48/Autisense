from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.services.groq_client import groq_chat_completion


logger = logging.getLogger(__name__)


REQUIRED_FIELDS = ["status", "differences", "explanation", "recommendation"]
VALID_STATUSES = ["Improved", "Worsened", "No significant change", "Insufficient data"]


def _extract_json_object(raw: str) -> dict[str, Any]:
    """Parse JSON from LLM output even if surrounded by prose/code fences."""
    text = (raw or "").strip()
    if not text:
        raise json.JSONDecodeError("empty", text, 0)

    # Fast path
    try:
        return json.loads(text)
    except Exception:
        pass

    # Remove markdown fences if present
    fence_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, flags=re.IGNORECASE)
    if fence_match:
        candidate = fence_match.group(1)
        try:
            return json.loads(candidate)
        except Exception:
            pass

    # Find first balanced {...} block
    start = text.find("{")
    while start != -1:
        depth = 0
        for i in range(start, len(text)):
            ch = text[i]
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start:i + 1]
                    try:
                        return json.loads(candidate)
                    except Exception:
                        break
        start = text.find("{", start + 1)

    raise json.JSONDecodeError("unable to extract json", text, 0)


def _normalize_response(d: dict[str, Any]) -> dict[str, str]:
    """Normalize model output keys/status into strict API contract."""
    key_map = {
        "key_differences": "differences",
        "analysis": "explanation",
        "recommended_actions": "recommendation",
    }

    normalized: dict[str, Any] = {}
    for k, v in (d or {}).items():
        normalized[key_map.get(k, k)] = v

    for field in REQUIRED_FIELDS:
        if field not in normalized or normalized[field] is None:
            normalized[field] = ""

    status_raw = str(normalized.get("status", "")).strip().lower()
    if status_raw in {"improved", "better", "improvement"}:
        normalized["status"] = "Improved"
    elif status_raw in {"worsened", "worse", "declined", "decline"}:
        normalized["status"] = "Worsened"
    elif status_raw in {"no significant change", "no change", "unchanged", "stable"}:
        normalized["status"] = "No significant change"
    elif status_raw in {"insufficient data", "unknown", "not enough data"}:
        normalized["status"] = "Insufficient data"
    elif normalized.get("status") not in VALID_STATUSES:
        normalized["status"] = "No significant change"

    return {
        "status": str(normalized.get("status", "No significant change")).strip() or "No significant change",
        "differences": str(normalized.get("differences", "")).strip() or "No clear differences found",
        "explanation": str(normalized.get("explanation", "")).strip() or "Unable to provide detailed explanation",
        "recommendation": str(normalized.get("recommendation", "")).strip() or "Please consult a specialist for further evaluation",
    }


def compare_reports(*, previous_report: str, current_report: str) -> dict[str, Any]:
    """
    Compare two autism assessment reports using Groq LLM.
    
    Args:
        previous_report: JSON string or text of the previous screening report
        current_report: JSON string or text of the current screening report
    
    Returns:
        Dictionary with status, differences, explanation, and recommendation
    """
    
    # Build concise comparison prompt
    prompt = f"""You are an autism assessment specialist. Compare two screening reports.

PREVIOUS SCREENING:
{previous_report}

CURRENT SCREENING:
{current_report}

ANALYSIS TASK:
1. Compare behavioral indicators between the two screenings
2. Identify if the child has Improved, Worsened, or shows No change
3. List specific differences observed
4. Explain why the change occurred (or why no change)
5. Recommend next steps

VALID STATUSES:
- "Improved" (if current shows better outcomes)
- "Worsened" (if current shows worse outcomes)
- "No significant change" (if similar)
- "Insufficient data" (if unable to compare)

RESPONSE FORMAT - Output ONLY valid JSON:
{{
  "status": "...",
  "differences": "...",
  "explanation": "...",
  "recommendation": "..."
}}"""

    try:
        # Call Groq LLM for comparison
        response_text = groq_chat_completion(prompt=prompt)
        
        response_dict = _extract_json_object(response_text)
        response_dict = _normalize_response(response_dict)
        
        logger.info(f"Report comparison completed: {response_dict['status']}")
        
        return response_dict
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.debug("Raw LLM output for compare_reports: %s", response_text if 'response_text' in locals() else "")
        return {
            "status": "Insufficient data",
            "differences": "Unable to parse comparison results",
            "explanation": "The comparison analysis could not be properly formatted",
            "recommendation": "Please ensure both reports contain sufficient behavioral assessment data"
        }
    except Exception as e:
        logger.error(f"Error during report comparison: {e}")
        return {
            "status": "Insufficient data",
            "differences": "Error occurred during comparison",
            "explanation": str(e),
            "recommendation": "Please try again with valid reports"
        }
