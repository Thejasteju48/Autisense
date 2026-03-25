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
    question: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    n_results: int = Field(default=4, ge=1, le=6)


class ChatResponse(BaseModel):
    answer: str
    used_report_context: bool
    retrieved_chunks: list[str] = Field(default_factory=list)
