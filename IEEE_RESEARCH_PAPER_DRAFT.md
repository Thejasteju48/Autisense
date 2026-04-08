# Autisense: A Multi-Modal AI-Powered Autism Screening and Parent Guidance System for Early Childhood

## Abstract
Early identification of autism spectrum disorder (ASD) in toddlers is essential for timely intervention and family support. This paper presents Autisense, a multi-modal autism screening and parent guidance system designed for children aged 16-48 months. The system integrates a validated parent questionnaire, pre-recorded video behavioral analysis, emotion variation detection, a retrieval-augmented generation (RAG) chatbot, longitudinal report comparison, automated PDF report generation, and nearby support center recommendations. The proposed workflow is intentionally designed for screening and decision support rather than diagnosis. The system combines structured screening signals with explainable AI outputs to improve usability for parents and caregivers. This manuscript describes the problem, architecture, methods, implementation, recommendation logic, and an evaluation plan suitable for future empirical validation.

Index Terms—Autism screening, early detection, computer vision, retrieval-augmented generation, parent guidance, explainable AI, pediatric decision support, multi-modal AI.

## I. Introduction
Autism spectrum disorder is a neurodevelopmental condition characterized by differences in social communication, social reciprocity, restricted interests, repetitive behaviors, and sensory regulation patterns. Because autism is developmental and early signs may be subtle, timely screening is important for identifying children who may benefit from further clinical evaluation. Families often require a system that is not only technically accurate but also understandable and actionable.

This project addresses that need by combining multiple sources of evidence into a single screening platform. Instead of relying on a single input type, Autisense integrates pre-recorded video behavioral analysis, questionnaire responses, report-aware question answering, and follow-up recommendation generation. The operational flow in this system is fixed as follows: first, a pre-recorded child video is uploaded and analyzed; second, the parent completes the questionnaire; finally, the system fuses both outputs for risk interpretation and guidance. This ordering is used intentionally to prioritize objective behavioral capture before parent-reported responses. The goal is to help parents understand screening outputs in simple language while preserving clinical caution. The system is explicitly intended for screening support, not diagnostic decision making.

From a research perspective, the novelty of the project lies in integrating a video-first screening workflow with explainable AI support and longitudinal report-aware guidance in one deployable architecture. The system is designed for real-world usability by non-technical caregivers while maintaining medically cautious communication boundaries.

The main contributions of this work are as follows:
1. A full-stack autism screening architecture combining web, machine learning, and retrieval-based AI components.
2. A hybrid screening workflow using questionnaire and video-derived behavioral signals.
3. A report-aware parent guidance chatbot that uses indexed medical report content safely.
4. A longitudinal comparison mechanism for previous and current screenings.
5. A structured recommendation system covering therapy, daily activities, specialist guidance, follow-up, and parent learning.

## II. Problem Statement
Traditional autism screening solutions often depend on either questionnaires or direct observation. Questionnaires are scalable but may miss behavioral nuance. Observation-based systems are informative but difficult to standardize at scale. In addition, many systems provide output that is difficult for parents to interpret or act upon.

The project addresses the following problems:
- Lack of a single integrated screening flow for questionnaire, video, report generation, and guidance.
- Limited explainability of behavioral indicators.
- Weak support for comparing repeated screenings over time.
- Insufficient actionable home-based guidance for caregivers.
- Poor integration between screening results and contextual parent support.

## III. System Overview
Autisense is implemented as a distributed full-stack application with four layers: frontend, backend orchestration, AI services, and storage.

### A. Frontend Layer
The React-based frontend provides:
- Authentication screens.
- Child profile management.
- Screening workflow pages.
- Results dashboard.
- Parent guidance chat.
- Screening history.
- Video and PDF upload interfaces.

### B. Backend Layer
The Express.js backend handles:
- User registration and login.
- JWT-based authentication.
- Screening orchestration.
- Report upload management.
- PDF generation.
- Chat routing and response delivery.

### C. AI Service Layer
The AI stack includes:
- Video analysis service for behavior detection.
- Emotion analysis service for facial emotion variation.
- RAG service for report indexing, semantic retrieval, comparison analysis, and recommendation generation.

### D. Data Layer
The system uses:
- MongoDB for users, children, screenings, and chat sessions.
- ChromaDB for indexed PDF chunks and semantic retrieval.

## IV. Methodology
The system uses a multi-stage methodology.

### A. Questionnaire-Based Screening
A binary questionnaire is used to collect parent-reported developmental concerns. The questionnaire captures behavior patterns related to social communication, response behavior, interaction, and repetitive patterns.

### B. Video-Based Behavioral Analysis
The video analysis pipeline processes a pre-recorded child video and extracts structured behavior markers:
- Eye contact.
- Hand stimming.
- Head stimming.
- Hand gestures.
- Social reciprocity.
- Emotion variation.

In the implemented screening flow, this video stage is executed before questionnaire completion.

### C. Six Video Feature Detection Algorithms
This subsection formalizes the six feature detectors used in the video pipeline. Each detector maps noisy frame-level observations to a stable session-level label using confidence filtering, temporal smoothing, and rule-based decision thresholds.

1. Algorithm 1: Eye Contact Detection
- Input: RGB video frames, facial landmarks, head-pose angles, frame confidence.
- Processing pipeline:
	- Detect face and facial landmarks in each frame and reject low-confidence frames.
	- Estimate gaze proxy using eye-region geometry and head orientation (yaw/pitch) relative to camera axis.
	- Mark a frame as socially engaged when both face direction and gaze proxy are near camera-facing limits.
	- Compute eye-contact ratio as engaged frames divided by valid face frames.
	- Apply minimum-duration constraint so short accidental looks do not dominate the score.
- Decision logic:
	- Low Eye Contact: eye-contact ratio below threshold for the session.
	- Normal Eye Contact: ratio at or above threshold.
- Rationale: sustained face-oriented engagement is treated as a screening proxy for joint attention availability.

2. Algorithm 2: Hand Stimming Detection
- Input: hand landmarks over time for left and right hands, per-frame tracking confidence.
- Processing pipeline:
	- Build wrist and fingertip trajectories in normalized coordinates.
	- Compute velocity and acceleration profiles to separate purposeful motion from micro-jitter.
	- Estimate oscillation strength using periodicity features from short temporal windows.
	- Merge windows into candidate episodes when repetitive motion persists with limited spatial goal progression.
	- Calculate stimming burden as repetitive-episode duration divided by observable hand duration.
- Decision logic:
	- Present: burden and periodicity jointly exceed thresholds.
	- Absent: otherwise.
- Rationale: repetitive high-frequency, low-goal movement patterns are treated as potential stimming signatures.

3. Algorithm 3: Head Stimming Detection
- Input: face landmarks, head-pose sequence (yaw, pitch, roll), timestamped frames.
- Processing pipeline:
	- Estimate pose angles per frame and smooth with temporal filtering to suppress landmark jitter.
	- Remove long-term drift so detector focuses on short repetitive components.
	- Detect cyclic motion in one or more axes using windowed periodicity and peak-consistency checks.
	- Validate candidate cycles with amplitude bounds and persistence rules.
- Decision logic:
	- Present: repeated rhythmic head movement sustained beyond minimum window count.
	- Absent: no sustained rhythmic pattern.
- Rationale: repetitive patterned head movement is separated from natural exploratory head motion.

4. Algorithm 4: Hand Gesture Detection
- Input: hand landmarks, body/arm landmarks, relative hand-to-body geometry.
- Processing pipeline:
	- Derive gesture primitives such as pointing direction, open-palm wave trajectories, reaching vectors, and show-object posture.
	- Score each frame/window for communicative intent using hand orientation, arm extension, and movement context.
	- Penalize repetitive non-communicative trajectories to avoid confusion with stimming.
	- Aggregate communicative evidence over the session to produce gesture availability score.
- Decision logic:
	- Present: communicative gesture score exceeds threshold.
	- Absent: score below threshold.
- Rationale: social-communicative gestures are prioritized over generic hand motion.

5. Algorithm 5: Social Reciprocity Detection
- Input: face orientation, body orientation, interaction timing cues, engagement windows.
- Processing pipeline:
	- Compute orientation-to-partner/camera likelihood as a proxy for interaction readiness.
	- Segment the video into interaction windows and estimate response consistency across windows.
	- Build reciprocity score from weighted components: orientation engagement, response continuity, and interaction persistence.
	- Apply stability checks so isolated cooperative moments do not overestimate reciprocity.
- Decision logic:
	- Low: reciprocity score below threshold.
	- Normal: score at or above threshold.
- Rationale: reciprocity is modeled as repeated social response behavior, not a single momentary event.

6. Algorithm 6: Emotion Variation Detection
- Input: cropped face frames, per-frame emotion probability vectors from emotion classifier.
- Processing pipeline:
	- Retain only high-confidence face frames and obtain emotion distribution per frame.
	- Build temporal histogram of dominant emotions and compute diversity metric (entropy-like index).
	- Evaluate transition richness (how often emotion states change) to avoid false diversity from noisy single-frame spikes.
	- Produce session-level emotion-variation score by combining diversity and transition features.
- Decision logic:
	- Low: diversity and transition richness jointly remain below threshold.
	- Normal: otherwise.
- Rationale: persistent low expressive variation can indicate reduced social-emotional flexibility in the observed context.

Across all six algorithms, the system applies common robustness controls: frame-confidence gating, temporal smoothing, missing-data tolerance, minimum observation duration, and session-level aggregation. These controls reduce sensitivity to blur, occlusions, camera motion, and short tracking failures.

### D. Emotion Variation Analysis
Facial emotion variation is used as a complementary behavioral signal. A narrow emotion range can indicate limited expression diversity, which may be relevant to social communication screening.

### E. Risk Scoring
The questionnaire and video features are combined into a hybrid screening result. The system assigns a risk category such as low, moderate, or high risk based on the aggregated signals.

### F. LLM-Based Explanation
Groq LLM is used to convert structured screening results into parent-friendly explanations. The prompt is constrained so that it does not invent unsupported findings.

### G. Retrieval-Augmented Generation
Uploaded medical reports are indexed into ChromaDB. When the user asks about the report, the chatbot retrieves relevant chunks and answers using both retrieved report content and current system data.

### H. Longitudinal Comparison
The system can compare previous and current screenings to identify changes in behavior, risk level, and indicator trends.

## V. Implementation Details

### A. Authentication Module
The authentication module provides:
- User registration.
- Secure password hashing.
- Login and JWT token generation.
- Protected routes.
- Session continuity.

### B. Child Profile Module
The child profile stores:
- Name.
- Age.
- Gender.
- Related parent account.

### C. Screening Module
The screening module manages:
- Screening creation.
- Video upload.
- Questionnaire completion.
- Result generation.
- Screening history.

### D. Video Analysis Module
The video analysis service detects social and behavioral markers relevant to early autism screening. The pipeline is computer-vision based and returns structured outputs that the backend can store and explain.

### E. Emotion Analysis Module
The emotion service measures diversity and variation in facial expressions, providing an additional signal for social-emotional assessment.

### F. PDF Report Generation Module
The PDF generator produces a medical-style report containing:
- Patient information.
- Behavioral findings.
- Questionnaire summary.
- Risk level.
- Clinical-style interpretation.
- Recommendations.
- Nearby support resources.

### G. RAG Chatbot Module
The chatbot supports:
- Result interpretation.
- Indicator explanation.
- Report-aware Q&A.
- Previous vs. current report comparison.
- Recommendation generation.
- App usage guidance.

### H. Report Indexing and Retrieval Module
Uploaded PDF reports are extracted, chunked, embedded, and indexed for semantic search. This enables the chatbot to answer report-specific questions without inventing content.

### I. Recommendation System Module
The recommendation engine is organized into five modules:
1. Therapy Recommendations.
2. Daily Activity Recommendations.
3. Specialist/Center Recommendations.
4. Follow-up Recommendations.
5. Parent Learning Recommendations.

This structure is suitable for parent support and is one of the strongest candidates for publication emphasis because it translates screening results into actionable guidance.

## VI. Recommendation Logic
The recommendation system uses structured logic derived from the screening outputs.

### A. Therapy Recommendations
The system may suggest:
- Speech therapy.
- Occupational therapy.
- Parent-mediated interaction therapy.
- Play-based developmental intervention.
- Specialist evaluation.

### B. Daily Activity Recommendations
The system may recommend:
- Eye contact games.
- Turn-taking activities.
- Joint attention exercises.
- Gesture-based interaction.
- Story reading with prompts.

### C. Specialist/Center Recommendations
The system may recommend consultation with:
- Developmental pediatricians.
- Child psychologists.
- Speech therapists.
- Occupational therapists.
- Nearby autism support centers.

### D. Follow-Up Recommendations
The system may suggest:
- Repeat screening intervals.
- Weekly tracking of communication behaviors.
- Monitoring of eye contact and gestures.
- Urgent follow-up if symptoms intensify.

### E. Parent Learning Recommendations
The system may provide:
- Eye contact support strategies.
- Gesture-building activities.
- Routine-based interaction ideas.
- Regulation and communication tips.

## VII. Data Representation

### A. Questionnaire Data
The questionnaire provides 20 binary responses and a derived concern score.

### B. Video Feature Data
The video pipeline produces the following features:
- Eye contact status.
- Hand stimming status.
- Head stimming status.
- Hand gesture status.
- Social reciprocity status.
- Emotion variation status.

### C. Report Context Data
The report indexing system stores extracted PDF text as searchable semantic chunks.

### D. Comparison Data
The comparison engine stores previous and current screening summaries to support trend analysis.

## VIII. Evaluation Plan
A publication-quality evaluation should measure:

### A. Functional Correctness
- Screening workflow completion.
- PDF generation.
- Report upload and indexing.
- Chatbot response routing.
- Comparison output generation.

### B. Response Quality
- Relevance.
- Grounding in system data.
- Parent readability.
- Safety and caution.
- Actionability.

### C. Recommendation Quality
- Specificity.
- Age appropriateness.
- Behavior linkage.
- Practical usefulness.
- Follow-up clarity.

### D. Usability
- Parent understanding of results.
- Ease of screening completion.
- Ease of report upload.
- Satisfaction with guidance.

## IX. Limitations
The current system has the following limitations:
- It is a screening and guidance tool, not a diagnostic tool.
- It depends on the quality of uploaded video and report content.
- It requires empirical validation before any clinical claims.
- Recommendation quality should be reviewed by domain experts.
- RAG responses depend on the correctness of uploaded report indexing.

## X. Ethical Considerations
Because the system handles child developmental data, the following principles are essential:
- Do not present the system as diagnostic.
- Use cautious and non-alarming language.
- Protect user privacy and report confidentiality.
- Encourage professional evaluation when concerning indicators appear.
- Avoid unsupported medical claims.

## XI. Future Work
Future improvements may include:
- Clinical validation study.
- Larger dataset evaluation.
- Multi-language PDF reports.
- Better recommendation personalization.
- Mobile app support.
- Stronger longitudinal visualization.
- Expanded parent education content.

## XII. Conclusion
Autisense is a multi-modal autism screening and parent guidance system that combines questionnaire data, video analysis, report-aware retrieval, comparison across screenings, and structured recommendations. The main scientific value of the project is its integration of explainable AI with practical parent support. For publication, the strongest next step is to collect evaluation data, validate response quality with experts, and clearly present the screening-only scope.

## References
[1] Autism screening and early intervention literature.
[2] M-CHAT-R validation studies.
[3] Computer vision in behavioral health screening.
[4] Retrieval-augmented generation for healthcare support.
[5] Explainable AI in clinical decision support.

## Appendix: Suggested Figures
- Fig. 1. Overall system architecture.
- Fig. 2. Screening workflow.
- Fig. 3. Video analysis pipeline.
- Fig. 4. Report indexing and retrieval flow.
- Fig. 5. Recommendation engine structure.
- Fig. 6. Previous-vs-current screening comparison.

## Appendix: Suggested Tables
- Table I. System modules and responsibilities.
- Table II. Behavioral indicators and interpretations.
- Table III. Recommendation modules and outputs.
- Table IV. Evaluation metrics.
- Table V. Service endpoints.
