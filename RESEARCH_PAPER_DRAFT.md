# Autisense: A Multi-Modal AI-Powered Autism Screening and Parent Guidance System for Early Childhood

## Abstract
Early identification of autism spectrum disorder (ASD) in toddlers is essential for timely intervention, family support, and improved developmental outcomes. This project presents Autisense, a full-stack multi-modal autism screening system designed for children aged 16-48 months. The system combines a validated parent questionnaire, computer vision-based behavioral analysis, emotion variation detection, a retrieval-augmented generation (RAG) parent guidance chatbot, PDF report generation, and nearby center recommendation support. The proposed workflow integrates a parent-filled screening questionnaire, pre-recorded video analysis of the child, risk scoring, longitudinal comparison across screenings, and context-aware guidance through an LLM-powered chatbot. The system is intentionally positioned as a screening and decision-support platform, not a diagnostic tool. This manuscript documents the problem statement, system architecture, implementation methodology, major modules, data flow, recommendation logic, and publication-ready framing for future experimental validation. 

Keywords: autism screening, early detection, computer vision, RAG chatbot, parent guidance, multi-modal AI, pediatric screening, machine learning, healthcare decision support

## 1. Introduction
Autism spectrum disorder is a neurodevelopmental condition characterized by differences in social communication, restricted interests, repetitive behaviors, and sensory or behavioral regulation patterns. Because ASD is developmental and symptoms may appear gradually, early screening is important for identifying children who may require further clinical evaluation. In practice, parents and caregivers often need a system that is not only accurate but also understandable, accessible, and supportive.

This project was built to address that need by combining traditional screening logic with AI-based observation and conversational support. Instead of relying on a single signal, Autisense uses a multi-modal pipeline consisting of questionnaire responses, video-derived behavior markers, report comparison, and contextual LLM-based explanation. The goal is to help parents understand developmental concerns in simple language while preserving clinical caution.

The project is designed around three core principles. First, it should be useful for screening, not diagnosis. Second, it should provide explanations that parents can understand and act on. Third, it should support repeated screenings so progress or worsening can be tracked over time.

## 2. Problem Statement
Traditional autism screening often depends on one of two approaches: structured questionnaires or expert observation. Questionnaires are scalable but may miss behavioral nuance. Direct observation is informative but time-intensive and not always available. Many families also struggle to interpret report outputs or to translate them into practical next steps.

The specific problems addressed by this project are:
- Lack of a single integrated screening flow for questionnaire, video, report generation, and guidance.
- Limited explainability in many screening systems.
- Poor support for longitudinal comparison across multiple screenings.
- Lack of actionable home-based recommendations for parents.
- Difficulty accessing context-aware support after a screening result is generated.

## 3. Project Objectives
The objectives of Autisense are:
- To provide a parent-friendly autism screening workflow for toddlers.
- To combine questionnaire-based and video-based indicators into a risk assessment.
- To explain each behavioral indicator in simple language.
- To generate structured medical-style PDF reports.
- To support comparison between previous and current screenings.
- To recommend therapies, daily activities, specialist support, and follow-up actions.
- To provide nearby center suggestions and parent guidance through a RAG chatbot.

## 4. System Overview
Autisense is implemented as a distributed full-stack application with the following main components:
- React frontend for user interaction.
- Express.js backend for authentication, screening orchestration, report handling, and chatbot coordination.
- FastAPI video analysis service for behavior detection.
- FastAPI emotion analysis service for facial emotion variation.
- FastAPI RAG service for report indexing, contextual question answering, comparison analysis, and recommendation generation.
- MongoDB for application data storage.
- ChromaDB for report chunk indexing and retrieval.

### 4.1 High-Level User Flow
1. User registers or logs in.
2. Parent creates a child profile.
3. Screening begins.
4. Parent fills the questionnaire.
5. A pre-recorded video is uploaded for behavioral analysis.
6. The screening engine generates risk results.
7. A PDF report is generated.
8. The parent can ask questions in the chatbot.
9. Uploaded reports can be indexed and compared across screenings.
10. Recommendations and nearby support resources are presented.

## 5. Architecture
The architecture is organized into frontend, backend, AI services, and storage layers.

### 5.1 Frontend Layer
The frontend is built with React and provides:
- Authentication screens.
- Child profile management.
- Screening workflow pages.
- Results dashboard.
- Parent guidance chat.
- Screening history and previous report views.
- Upload interfaces for video and report documents.

### 5.2 Backend Layer
The Node.js/Express backend coordinates:
- User registration and login.
- JWT-based authentication.
- Screening creation and result storage.
- Communication with ML and RAG services.
- PDF report generation.
- Chat request routing.
- Upload management.

### 5.3 AI Service Layer
The AI stack includes:
- Video analysis service for eye contact, hand stimming, head stimming, hand gestures, and social reciprocity.
- Emotion service for emotion variation assessment.
- RAG service for report indexing, answer generation, report comparison, and recommendation outputs.

### 5.4 Data Layer
- MongoDB stores users, children, screenings, and chat sessions.
- ChromaDB stores report chunks and embeddings for semantic retrieval.

## 6. Methodology
The system uses a multi-stage methodology.

### 6.1 Questionnaire-Based Screening
A binary questionnaire is used to capture parent-reported developmental concerns. The questionnaire contributes to the overall risk profile by measuring social communication, response patterns, and behavioral markers relevant to early autism screening.

### 6.2 Video-Based Behavioral Analysis
The pre-recorded child video is analyzed for behavioral markers that are difficult to capture from questionnaires alone. The video pipeline produces structured outputs for:
- Eye contact.
- Hand stimming.
- Head stimming.
- Hand gestures.
- Social reciprocity.
- Emotion variation.

### 6.3 Emotion Variation Analysis
Emotion variation is used as a complementary signal. A limited emotional range may reflect reduced expression diversity, which can be relevant to social communication screening.

### 6.4 Risk Scoring
The project uses a hybrid risk score. The questionnaire and video components are combined into a unified assessment score. In addition, the system classifies risk into meaningful categories such as low, moderate, and high risk.

### 6.5 LLM-Based Explanation
Groq LLM is used to convert structured screening data into human-readable explanations. The LLM is constrained by prompt rules so that it does not invent unsupported conclusions.

### 6.6 Retrieval-Augmented Generation
For uploaded medical reports, the RAG pipeline indexes PDF content into ChromaDB, retrieves relevant chunks, and answers questions based on both the indexed report and the current system data.

### 6.7 Comparison Across Screenings
The system supports comparison between previous and current screenings. The comparison engine identifies whether indicators improved, worsened, or stayed the same, and generates recommendations accordingly.

## 7. Detailed Module Description

### 7.1 Authentication Module
The authentication module handles:
- User registration.
- Password hashing.
- Login and token creation.
- Protected routes.
- Session continuity.

This module ensures that each screening and report is linked to the correct family account.

### 7.2 Child Profile Module
This module stores child information such as:
- Name.
- Age.
- Gender.
- Relationship with the user.

The child profile allows the system to personalize explanations, recommendations, and activity plans.

### 7.3 Screening Module
The screening module controls the screening lifecycle:
- Create screening.
- Complete questionnaire.
- Upload or reference video.
- Generate risk assessment.
- Save results.

### 7.4 Video Analysis Module
The video analysis module uses computer vision to detect:
- Eye contact patterns.
- Repetitive movements.
- Communicative hand gestures.
- Social reciprocity behavior.
- Head movement stimming.

The purpose is not diagnosis, but structured behavioral screening.

### 7.5 Emotion Analysis Module
This module evaluates the diversity and variation of facial expressions across the video. Emotion variation is a supplemental behavioral signal used to support the social communication assessment.

### 7.6 PDF Report Generation Module
The PDF generator produces a structured medical-style report containing:
- Patient information.
- Behavioral summary.
- Questionnaire summary.
- Video findings.
- Risk classification.
- Recommendations.
- Nearby support resources.

### 7.7 RAG Chatbot Module
The chatbot is one of the most important components of the system. It supports:
- Result interpretation.
- Indicator explanations.
- Progress comparison.
- Recommendation generation.
- Uploaded report Q&A.
- App usage guidance.

### 7.8 Report Indexing and Retrieval Module
This module extracts text from uploaded PDFs, splits the content into chunks, embeds them, and stores them in ChromaDB for semantic retrieval.

### 7.9 Comparison Module
The comparison module compares two reports and identifies changes in:
- Risk level.
- Eye contact.
- Hand stimming.
- Hand gestures.
- Social reciprocity.
- Head stimming.

It returns a structured summary containing status, differences, explanation, and recommendation.

### 7.10 Recommendation System Module
The recommendation system is designed as a five-part output structure:
1. Therapy Recommendations.
2. Daily Activity Recommendations.
3. Specialist/Center Recommendations.
4. Follow-up Recommendations.
5. Parent Learning Recommendations.

This module is especially important for research publication because it converts screening output into actionable intervention guidance.

## 8. Recommendation Logic
The recommendation system uses the following logic:
- Risk level determines urgency.
- Specific indicators determine recommendation type.
- Missing data is handled cautiously.
- Comparison results influence follow-up planning.
- Location-aware support can suggest nearby centers.

### 8.1 Therapy Recommendations
Depending on the detected concerns, the system may suggest:
- Speech therapy.
- Occupational therapy.
- Parent-mediated interaction therapy.
- Play-based developmental intervention.
- Specialist clinical evaluation.

### 8.2 Daily Activity Recommendations
The system can recommend:
- Eye contact games.
- Peek-a-boo and turn-taking activities.
- Pointing and gesture games.
- Story reading with interactive prompts.
- Joint attention activities.

### 8.3 Specialist/Center Recommendations
The system can recommend:
- Developmental pediatrician.
- Child psychologist.
- Speech therapist.
- Occupational therapist.
- Nearby autism support center.

### 8.4 Follow-Up Recommendations
The system can recommend:
- Weekly parent tracking.
- Repeat screening intervals.
- Urgent consultation if warning signs increase.
- Monitoring of communication and social behavior.

### 8.5 Parent Learning Recommendations
The system can recommend:
- How to encourage eye contact.
- How to support gestures and pointing.
- How to reduce stress during interaction.
- How to create predictable routines.

## 9. Data and Feature Representation
The system represents data in the following form:

### 9.1 Questionnaire Data
- 20 yes/no responses.
- Score derived from concern patterns.
- Mapped to parent-reported developmental behavior.

### 9.2 Video Features
- Eye contact status.
- Hand stimming status.
- Head stimming status.
- Hand gesture status.
- Social reciprocity status.
- Emotion variation status.

### 9.3 Report Context Data
- Extracted text from medical PDF.
- Indexed semantic chunks.
- Query-specific retrieval results.

### 9.4 Comparison Data
- Previous screening data.
- Current screening data.
- Difference summary.
- Progress trend.

## 10. Implementation Details

### 10.1 Frontend
The frontend is organized into pages and reusable components. It supports user flows for registration, screening, report viewing, chat, and history.

### 10.2 Backend
The backend acts as the orchestration layer and ensures the right data reaches the right AI service.

### 10.3 FastAPI Services
The FastAPI services were used because they are lightweight, good for AI workloads, and simple to connect through HTTP endpoints.

### 10.4 LLM Prompt Engineering
The RAG prompt design was important because the chatbot needed to:
- Answer only from available data.
- Avoid diagnostic claims.
- Avoid hallucinating uploaded report contents.
- Provide practical, parent-friendly guidance.
- Follow structured formats for explanation and recommendation output.

### 10.5 JSON Parsing and Robustness
The comparison service was hardened to handle non-strict LLM output. This is important in real systems because model outputs can include extra text or formatting.

## 11. Research Contribution
This project contributes the following ideas:
- A practical full-stack autism screening pipeline for early childhood.
- A multi-modal design combining questionnaire and video analysis.
- A RAG-based parent guidance assistant for report-aware questioning.
- A longitudinal comparison engine for repeated screening sessions.
- A structured recommendation system with intervention and follow-up logic.

## 12. Evaluation Plan
For publication, the following evaluation strategies can be used:

### 12.1 Functional Evaluation
- Verify that questionnaire, video upload, report upload, and chatbot all work end-to-end.
- Validate that the comparison system produces stable results.
- Verify that recommendations adapt to risk level and indicator patterns.

### 12.2 Response Quality Evaluation
Assess chatbot answers on:
- Relevance.
- Grounding in data.
- Clarity.
- Safety and clinical caution.
- Actionability.

### 12.3 System Usability Evaluation
Assess whether parents can:
- Complete the screening.
- Understand results.
- Compare screenings.
- Follow recommendations.
- Access uploaded report guidance.

### 12.4 Recommendation Quality Evaluation
Measure whether recommendations are:
- Specific.
- Age-appropriate.
- Behavior-linked.
- Clinically sensible.
- Useful for home practice.

## 13. Limitations
The current system has several limitations:
- It is a screening tool, not a diagnostic system.
- It depends on quality of uploaded video and report content.
- Some outputs depend on model-generated explanation quality.
- Evaluation data must be collected from real testing sessions for publication claims.
- The recommendation system should be validated by domain experts before clinical deployment.

## 14. Ethical Considerations
Because the project deals with child developmental health, the following considerations are critical:
- Do not present the system as a diagnosis tool.
- Protect user privacy and health data.
- Avoid alarming or overly certain language.
- Provide transparent guidance to seek professional evaluation.
- Ensure uploaded reports and screening results are stored securely.

## 15. Future Work
Future improvements may include:
- Clinical validation study with expert review.
- Larger dataset and improved behavioral detection accuracy.
- Better personalization of recommendations.
- Multi-language PDF reports.
- Mobile app support.
- Richer analytics dashboard.
- Stronger comparison visualization across time.

## 16. Publication-Ready Paper Outline
If you want to publish this work, use the following structure:
1. Abstract.
2. Introduction.
3. Related Work.
4. Problem Statement.
5. Proposed System.
6. Methodology.
7. Implementation Details.
8. Evaluation.
9. Discussion.
10. Limitations and Ethics.
11. Conclusion.
12. References.

## 17. Conclusion
Autisense is a comprehensive multi-modal autism screening and parent guidance system that integrates questionnaire-based screening, video behavioral analysis, report indexing, comparison over time, and LLM-based explanation. The project is particularly strong as a research paper candidate because it combines health screening, explainable AI, retrieval-augmented support, and actionable recommendations in one architecture. For publication, the most important next step is to collect empirical evaluation results, involve expert review, and clearly define the screening-only scope.

## 18. Reference Placeholders
Replace these with actual citations in the final manuscript:
- Autism screening and early intervention literature.
- M-CHAT-R validation studies.
- Computer vision in behavioral health screening.
- Retrieval-augmented generation for healthcare support.
- Explainable AI in clinical decision support.

## Appendix A: Suggested Figures
- Figure 1: System architecture diagram.
- Figure 2: Screening workflow diagram.
- Figure 3: Video analysis pipeline.
- Figure 4: RAG chatbot retrieval flow.
- Figure 5: Recommendation system flow.
- Figure 6: Comparison between previous and current screenings.

## Appendix B: Suggested Tables
- Table 1: Project modules and responsibilities.
- Table 2: Behavioral indicators and their meanings.
- Table 3: Recommendation modules and outputs.
- Table 4: Evaluation criteria.
- Table 5: System endpoints.

## Appendix C: Suggested Metrics to Report
- Screening completion time.
- Chat response latency.
- PDF generation time.
- Retrieval precision for uploaded reports.
- Comparison response quality.
- Recommendation usefulness score.
- Parent satisfaction score.

