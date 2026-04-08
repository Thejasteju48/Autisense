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


def build_strict_prompt(*, system_data: dict[str, Any], comparison_data: dict[str, Any], retrieved_context: str, question: str, intent: str, has_report_context: bool, is_comparison_question: bool = False) -> str:
    # Use headings only when the question needs explanation/interpretation/recommendation.
    use_sections = intent in {"explanation", "interpretation", "recommendation"}

    intent_rules = ""
    app_guide = ""
    
    # Keep context concise and avoid over-prescriptive numeric claims.
    developmental_context = (
        "DEVELOPMENTAL MILESTONES FOR AUTISM DETECTION (Ages 16-36 months):\n"
        "TYPICAL BEHAVIORS:\n"
        "• Eye Contact: regular face-looking during interaction\n"
        "• Hand Use: Emerging pointing (12-18m), waving bye-bye, showing objects\n"
        "• Social Sharing: Enjoys back-and-forth games, shows interest in other children\n"
        "• Emotional Expression: Shows varied facial expressions throughout day\n"
        "• Head Control: Smooth movements, no unusual repetitive patterns\n"
        "• Hand Movements: Purposeful, exploring toys with hands in typical ways\n\n"
        "CONCERNING PATTERNS (Key Autism Risk Indicators):\n"
        "• Low Eye Contact: Reduced joint attention and social connection\n"
        "  → Why it matters: Children learn through eye contact and shared focus. Very low eye contact suggests difficulty with social engagement.\n"
        "• Hand/Head Stimming: Repetitive self-directed movements\n"
        "  → Why it matters: Often indicates self-soothing or difficulty with regulation. Typical kids stim occasionally; high frequency = concern.\n"
        "• Limited Hand Gestures: Absent pointing, waving, or communicative gestures\n"
        "  → Why it matters: Gestures are how babies communicate before words. Absence suggests communication delay.\n"
        "• Low Social Reciprocity: Doesn't seek interaction or respond to social bids\n"
        "  → Why it matters: Back-and-forth interaction is foundation for language and relationships.\n"
        "• Restricted Emotion: Flat affect, limited expression variety\n"
        "  → Why it matters: Emotional expression is crucial for connection. Limited expression can indicate social communication challenges.\n\n"
    )
    
    # Initialize default values for intent-specific sections
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
            "4) Upload a pre-recorded video of the child for analysis\n"
            "5) Complete the questionnaire\n"
            "6) View screening results (risk level + indicators)\n"
            "7) Open the Parent Guidance Chat and ask questions\n"
            "8) Optional: click Upload Medical Report (PDF) in the chat to add a report for better answers\n"
        )

    recommendation_modules = ""

    if use_sections:
        if intent == "recommendation":
            recommendation_modules = (
                "RECOMMENDATION SYSTEM MODULES (must include all 5):\n"
                "1) Therapy Recommendations\n"
                "2) Daily Activity Recommendations\n"
                "3) Specialist/Center Recommendations\n"
                "4) Follow-up Recommendations\n"
                "5) Parent Learning Recommendations\n"
                "Use only available System Data + Report Context. If data is missing for any module, write 'Information not available' for that module only.\n"
            )

            response_format = (
                "Therapy Recommendations:\n"
                "- <Top 2-4 therapies ranked by priority: High/Medium/Low with why>\n"
                "- <Each therapy includes measurable goal and weekly frequency>\n\n"
                "Daily Activity Recommendations:\n"
                "- <Age-appropriate home activities mapped to current concern indicators>\n"
                "- <Each activity includes duration and parent cue/script>\n"
                "- <Include a short 3-block day template: Morning/Afternoon/Evening>\n\n"
                "Specialist/Center Recommendations:\n"
                "- <Which specialist to consult first and why>\n"
                "- <If location/center info exists, mention nearest options from available data only>\n"
                "- <If not available: Information not available>\n\n"
                "Follow-up Recommendations:\n"
                "- <When to repeat screening and what to track between visits>\n"
                "- <Escalation triggers for urgent clinical review>\n\n"
                "Parent Learning Recommendations:\n"
                "- <2-4 practical parent learning topics based on current indicators>\n"
                "- <One communication strategy and one behavior-regulation strategy>\n"
                "Use concise, clinically cautious language. Do not diagnose."
            )
        elif intent in {"explanation", "interpretation"}:
            response_format = (
                "Explanation:\n"
                "<2-4 sentences in parent-friendly language, specific to the asked question>\n"
                "<explain WHY this indicator/result matters for social communication or behavior>\n\n"
                "What it means:\n"
                "<1 short paragraph with concrete daily-life examples>\n"
                "<be reassuring but honest>\n\n"
                "Recommended actions:\n"
                "- <specific next step 1>\n"
                "- <specific next step 2>\n"
                "- <follow-up timeline>\n"
                "Do not give diagnosis; only explain what the indicators suggest.\n"
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

    comparison_section = (
        f"Previous Screening for Comparison:\n"
        f"{json.dumps(comparison_data, ensure_ascii=False, indent=2)}\n\n"
        "COMPARISON INSTRUCTIONS:\n"
        "- Use comparison only because the user explicitly asked to compare/progress-check.\n"
        "- If user asks about progress/improvement, COMPARE indicators between previous and current screening\n"
        "- Explain what has improved, what has stayed the same, and what needs attention\n"
        "- Be specific: mention which indicators changed and in what direction\n"
        "- DO NOT infer worsening/improvement from missing fields like N/A, Not recorded, or empty values\n"
        "- If key previous data is missing, explicitly say comparison is limited and avoid directional claims\n"
        "- If an indicator improved, acknowledge the progress positively\n"
        "- If an indicator worsened or stayed the same, provide supportive guidance\n"
        "- Always contextualize changes by age (remember: age_months is in MONTHS, not years)\n"
        "- Focus on the specific question: don't give generic answers about all indicators\n\n"
        if comparison_data.get("hasPreviousScreening") and is_comparison_question
        else ""
    )

    return (
        "You are an autism screening assistant helping parents understand their child's assessment.\n"
        "Your role is to educate, NOT to diagnose. Always explain WHY behaviors matter for autism screening.\n\n"
        "--------------------------------------------\n"
        "DEVELOPMENTAL CONTEXT:\n"
        "--------------------------------------------\n\n"
        f"{developmental_context}\n"
        "--------------------------------------------\n"
        "RULES:\n"
        "--------------------------------------------\n\n"
        "- Use SYSTEM DATA as primary source\n"
        "- Use REPORT CONTEXT only if relevant\n"
        "- Do NOT guess or hallucinate\n"
        "- If answer not found → say \"Information not available\"\n"
        "- Do NOT mention AI, model, or system\n"
        "- Do NOT give medical diagnosis\n"
        "- Use simple, parent-friendly language\n"
        "- ALWAYS explain WHY behaviors are concerns, not just that they are\n"
        "- VERY IMPORTANT: Answer the SPECIFIC question user asks. Don't give generic/irrelevant explanations.\n"
        "- Example: If user asks \"What does report say?\" → answer about report, not general autism facts\n"
        "- Example: If user asks \"Does my child need therapy?\" → answer about THIS child's condition specifically, with specific recommendations\n"
        "- Example: If user asks \"Did my child improve?\" → compare previous vs current, be specific about what changed\n"
        "- Use hyphen bullets only (start bullets with '- ').\n"
        "- Never invent specific numbers (age, scores, risk level). Use the exact values from System Data only.\n"
        "- Do not introduce normative percentages or thresholds unless they are present in System Data or Report Context.\n"
        "- If System Data contains age_months, it is in MONTHS. Do NOT describe it as years. Only convert to years if the user explicitly asks.\n"
        "- For recommendation intent, include all five recommendation modules exactly as requested.\n"
        f"{report_rule}\n"
        f"{intent_rules}\n"
        "--------------------------------------------\n"
        "TASK HANDLING:\n"
        "--------------------------------------------\n\n"
        "Detect intent:\n\n"
        "1. Explanation → explain indicator (WHY it matters)\n"
        "2. Interpretation → explain result meaning (contextualize the overall picture)\n"
        "3. Recommendation → suggest actions (what to do next)\n"
        "4. App guidance → explain how to use the web app step-by-step\n\n"
        f"Detected intent (use this): {intent}\n\n"
        f"Report context available: {'yes' if has_report_context else 'no'}\n\n"
        "--------------------------------------------\n"
        "RESPONSE FORMAT:\n"
        "--------------------------------------------\n\n"
        f"{recommendation_modules}\n"
        f"{response_format}\n\n"
        "--------------------------------------------\n"
        "INPUT:\n"
        "--------------------------------------------\n\n"
        f"{app_guide}\n"
        "System Data (Current Screening):\n"
        f"{json.dumps(system_data, ensure_ascii=False, indent=2)}\n\n"
        f"{comparison_section}"
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

    # For recommendation intent, preserve 5-module recommendation structure.
    if intent == "recommendation":
        recommendation_headers = [
            "Therapy Recommendations:",
            "Daily Activity Recommendations:",
            "Specialist/Center Recommendations:",
            "Follow-up Recommendations:",
            "Parent Learning Recommendations:",
        ]

        if all(h in t for h in recommendation_headers):
            return t

        return (
            "Therapy Recommendations:\nInformation not available\n\n"
            "Daily Activity Recommendations:\nInformation not available\n\n"
            "Specialist/Center Recommendations:\nInformation not available\n\n"
            "Follow-up Recommendations:\nInformation not available\n\n"
            "Parent Learning Recommendations:\nInformation not available"
        )

    # For structured intents, enforce headings so the UI can render sections.
    required = ["Explanation:", "What it means:", "Recommended actions:"]
    if all(r in t for r in required):
        return t

    return (
        "Explanation:\n" + t + "\n\n"
        "What it means:\nInformation not available\n\n"
        "Recommended actions:\nInformation not available"
    )
