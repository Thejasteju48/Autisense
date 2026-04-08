from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Any, Literal


Role = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    role: Role
    text: str


class IndexFromPathRequest(BaseModel):
    screening_id: str = Field(..., min_length=1)
    pdf_path: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    screening_id: str = Field(..., min_length=1)
    system_data: dict[str, Any] = Field(default_factory=dict)
    comparison_data: dict[str, Any] = Field(default_factory=dict)
    question: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    n_results: int = Field(default=4, ge=1, le=6)


class ChatResponse(BaseModel):
    answer: str
    used_report_context: bool
    retrieved_chunks: list[str] = Field(default_factory=list)


class ReportComparisonRequest(BaseModel):
    previous_report: str = Field(..., min_length=10)
    current_report: str = Field(..., min_length=10)


class ReportComparisonResponse(BaseModel):
    status: str  # "Improved", "Worsened", "No significant change", "Insufficient data"
    differences: str
    explanation: str
    recommendation: str


class CompareIndexedReportsRequest(BaseModel):
    previous_screening_id: str = Field(..., min_length=1)
    current_screening_id: str = Field(..., min_length=1)


class CompareReportPathsRequest(BaseModel):
    previous_pdf_path: str = Field(..., min_length=1)
    current_pdf_path: str = Field(..., min_length=1)
