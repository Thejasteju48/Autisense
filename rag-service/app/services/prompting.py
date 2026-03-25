from __future__ import annotations

import json
import re
from typing import Any


def detect_intent(question: str) -> str:
    q = (question or "").strip().lower()

    # Web-app usage / navigation questions should not be forced into the clinical sections.
    if re.search(r"\b(how\s+do\s+i\s+use|how\s+to\s+use|step\s*by\s*step|use\s+this\s+(web\s*)?app|navigate\s+the\s+app)\b", q):
        return "app_guidance"

    if re.search(r"\b(what\s+does|meaning|interpret|risk|result|score)\b", q):
        return "interpretation"

    # Be careful: do NOT match generic verbs like "do".
    # Include planning/schedule/routine requests as recommendation intent.
    if re.search(
        r"\b(what\s+should\s+i\s+do|what\s+can\s+i\s+do|next\s+steps|recommend|therapy|actions?|"
        r"plan|planning|schedule|routine|weekly\s+plan|one\s+week|week\s+plan|daily\s+activities?)\b",
        q,
    ):
        return "recommendation"

    if re.search(r"\b(explain|eye\s+contact|stimming|social\s+reciprocity|emotion)\b", q):
        return "explanation"

    return "other"


def build_question_with_history(question: str, history: list[dict[str, Any]], max_messages: int = 5) -> str:
    trimmed = history[-max_messages:] if history else []
    lines: list[str] = []
    for m in trimmed:
        role = (m.get("role") or "").strip() or "user"
        text = (m.get("text") or "").strip()
        if not text:
            continue
        lines.append(f"{role}: {text}")

    if not lines:
        return question

    return "Conversation history:\n" + "\n".join(lines) + "\n\nCurrent question:\n" + question


def build_strict_prompt(*, system_data: dict[str, Any], retrieved_context: str, question: str, intent: str, has_report_context: bool) -> str:
    # Use headings only when the question needs explanation/interpretation/recommendation.
    use_sections = intent in {"explanation", "interpretation", "recommendation"}

    intent_rules = ""
    app_guide = ""
    if intent == "app_guidance":
        intent_rules = (
            "- The user is asking how to use the web app. Give clear step-by-step UI instructions.\n"
            "- Do NOT restate screening System Data unless the user explicitly asks about results/indicators.\n"
            "- Mention the exact UI label when possible (e.g., Upload Medical Report (PDF)).\n"
        )
        app_guide = (
            "APP WORKFLOW (use this, do not invent extra pages):\n"
            "1) Register / log in\n"
            "2) Add a child profile (name, age, gender)\n"
            "3) Start a screening\n"
            "4) Complete the questionnaire\n"
            "5) Record or upload the child's video for analysis\n"
            "6) View screening results (risk level + indicators)\n"
            "7) Open the Parent Guidance Chat and ask questions\n"
            "8) Optional: click Upload Medical Report (PDF) in the chat to add a report for better answers\n"
        )

    if use_sections:
        if intent == "recommendation":
            response_format = (
                "Explanation:\n"
                "<1 short paragraph: what we're trying to improve and why>\n\n"
                "What it means:\n"
                "<1 short paragraph grounded in System Data only>\n\n"
                "Recommended actions:\n"
                "Write a PROFESSIONAL 7-day plan (one week).\n"
                "- Use exactly these day headers in order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n"
                "- For EACH day, include 3 time blocks: Morning (10-20 min), Afternoon (10-20 min), Evening (10-20 min)\n"
                "- Formatting rules (MUST follow exactly):\n"
                "  DayName\n"
                "  - Morning (10-20 min): Activity | Goal: ... | Parent script: \"...\"\n"
                "  - Afternoon (10-20 min): Activity | Goal: ... | Parent script: \"...\"\n"
                "  - Evening (10-20 min): Activity | Goal: ... | Parent script: \"...\"\n"
                "  (BLANK LINE between days)\n"
                "- Use hyphen bullets only: start every bullet with '- ' (do not use '*' bullets)\n"
                "- Put ONLY ONE bullet per line. Do not place two bullets on the same line.\n"
                "- Keep activities simple for age_months (months).\n"
                "After the 7-day plan, add: \n"
                "Tracking:\n"
                "- <bullet 1>\n"
                "- <bullet 2>\n"
                "- <bullet 3>\n"
                "When to get help:\n"
                "- <bullet 1>\n"
                "- <bullet 2>\n"
                "No messy lists, no long paragraphs inside the plan."
            )
        else:
            response_format = (
                "Explanation:\n"
                "<clear explanation>\n\n"
                "What it means:\n"
                "<based on system data>\n\n"
                "Recommended actions:\n"
                "<practical steps with a short plan>\n\n"
            )
    else:
        response_format = "Write a clear, parent-friendly answer in normal paragraphs. If steps are helpful, add a short bullet list."

    report_rule = (
        "- Report context IS PROVIDED below. You may use it, but only quote or summarize what is explicitly present in that text.\n"
        "- Do NOT include any personal names, report IDs, or identifying details from the report; use neutral terms like \"the child\" and \"the parent/guardian\".\n"
        "- Age, scores, and risk level MUST come from System Data only (even if the report contains them).\n"
        "- If the user asks about the report and the needed detail is not present in Report Context, say \"Information not available\".\n"
        if has_report_context
        else "- Report context is NOT provided (empty). Do NOT mention the report, uploaded report, PDF, or say \"the report states\". Answer only using System Data.\n"
    )

    return (
        "You are an autism screening assistant helping parents.\n\n"
        "--------------------------------------------\n"
        "RULES:\n"
        "--------------------------------------------\n\n"
        "- Use SYSTEM DATA as primary source\n"
        "- Use REPORT CONTEXT only if relevant\n"
        "- Do NOT guess or hallucinate\n"
        "- If answer not found → say \"Information not available\"\n"
        "- Do NOT mention AI, model, or system\n"
        "- Do NOT give medical diagnosis\n"
        "- Use simple language\n\n"
        "- Use hyphen bullets only (start bullets with '- ').\n"
        "- Never invent specific numbers (age, scores, risk level). Use the exact values from System Data only.\n"
        "- If System Data contains age_months, it is in MONTHS. Do NOT describe it as years. Only convert to years if the user explicitly asks.\n"
        f"{report_rule}\n"
        f"{intent_rules}\n"
        "--------------------------------------------\n"
        "TASK HANDLING:\n"
        "--------------------------------------------\n\n"
        "Detect intent:\n\n"
        "1. Explanation → explain indicator\n"
        "2. Interpretation → explain result meaning\n"
        "3. Recommendation → suggest actions\n"
        "4. App guidance → explain how to use the web app step-by-step\n\n"
        f"Detected intent (use this): {intent}\n\n"
        f"Report context available: {'yes' if has_report_context else 'no'}\n\n"
        "--------------------------------------------\n"
        "RESPONSE FORMAT:\n"
        "--------------------------------------------\n\n"
        f"{response_format}\n\n"
        "--------------------------------------------\n"
        "INPUT:\n"
        "--------------------------------------------\n\n"
        f"{app_guide}\n"
        "System Data:\n"
        f"{json.dumps(system_data, ensure_ascii=False, indent=2)}\n\n"
        "Report Context:\n"
        f"{retrieved_context}\n\n"
        "User Question:\n"
        f"{question}"
    )


def ensure_response(text: str, intent: str) -> str:
    t = (text or "").strip()
    if not t:
        if intent in {"explanation", "interpretation", "recommendation"}:
            return (
                "Explanation:\nInformation not available\n\n"
                "What it means:\nInformation not available\n\n"
                "Recommended actions:\nInformation not available"
            )
        return "Information not available"

    # For casual/general questions, return plain text.
    if intent not in {"explanation", "interpretation", "recommendation"}:
        return t

    # For structured intents, enforce headings so the UI can render sections.
    required = ["Explanation:", "What it means:", "Recommended actions:"]
    if all(r in t for r in required):
        return t

    return (
        "Explanation:\n" + t + "\n\n"
        "What it means:\nInformation not available\n\n"
        "Recommended actions:\nInformation not available"
    )
