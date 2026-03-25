const Groq = require('groq-sdk');
const { retrieveReportContext } = require('./reportRagService');

const apiKey = (process.env.GROQ_API_KEY || '').trim();
const groq = new Groq({ apiKey });

const DIAGNOSIS_SAFETY_MESSAGE =
  'This screening indicates certain behavioral patterns, but a formal diagnosis can only be made by a qualified specialist.';

const WEBAPP_GUIDE = [
  '1. Add child profile before starting screening.',
  '2. Complete questionnaire answers carefully.',
  '3. Upload or record screening video as instructed.',
  '4. Open results page to review behavioral findings.',
  '5. Download medical report for specialist consultation.',
  '6. Open Nearby Centers section and use Navigate button.',
  '7. Use this chat for result explanation and next-step guidance.',
].join('\n');

const getIntent = (question) => {
  const q = String(question || '').toLowerCase();

  if (/how to use|how do i use|use this app|webapp|website|where to click|upload report|navigate|download report/.test(q)) return 'app_guidance';
  if (/report|uploaded|pdf|document|what does the report/.test(q)) return 'report';
  if (/condition|status|symptom|sign/.test(q)) return 'interpretation';
  if (/what should i do|next|therapy|improve|help/.test(q)) return 'recommendation';
  if (/what does this result mean|at risk|risk level|interpret/.test(q)) return 'interpretation';
  if (/why|explain|what is eye contact|hand stimming|social reciprocity|emotion/.test(q)) return 'explanation';
  if (/what is autism|autism definition|general/.test(q)) return 'general';

  return 'other';
};

const isDiagnosisQuestion = (question) => {
  const q = String(question || '').toLowerCase();
  return /is my child autistic|is my child having autism|can you diagnose|diagnosis/.test(q);
};

const toSystemData = (screening) => ({
  age: screening?.child?.ageInMonths || null,
  risk_level: screening?.riskLevel || 'N/A',
  child_name: screening?.child?.name || screening?.child?.nickname || 'N/A',
  questionnaire_concerns: (screening?.questionnaire?.responses || [])
    .filter((r) => r && r.answer === false)
    .slice(0, 6)
    .map((r) => r.question),
  indicators: [
    screening?.liveVideoFeatures?.eyeContact,
    screening?.liveVideoFeatures?.headStimming,
    screening?.liveVideoFeatures?.handStimming,
    screening?.liveVideoFeatures?.handGesture,
    screening?.liveVideoFeatures?.socialReciprocity,
    screening?.liveVideoFeatures?.emotionVariation,
  ].filter(Boolean),
});

const isConcern = (key, rawValue) => {
  const value = String(rawValue || '').toLowerCase();
  const rules = {
    eyeContact: ['low', 'reduced', 'limited', 'poor'],
    headStimming: ['present', 'high', 'frequent'],
    handStimming: ['present', 'high', 'frequent'],
    handGesture: ['absent', 'limited', 'low'],
    socialReciprocity: ['low', 'reduced', 'limited'],
    emotionVariation: ['low', 'limited', 'restricted'],
  };
  return (rules[key] || []).some((k) => value.includes(k));
};

const buildVerifiedFacts = (screening) => {
  const features = screening?.liveVideoFeatures || {};
  const questionnaireConcerns = (screening?.questionnaire?.responses || [])
    .filter((r) => r && r.answer === false)
    .slice(0, 8)
    .map((r) => r.question);

  const indicators = [
    { key: 'eyeContact', label: 'Eye contact', value: features.eyeContact || 'N/A' },
    { key: 'headStimming', label: 'Head stimming', value: features.headStimming || 'N/A' },
    { key: 'handStimming', label: 'Hand stimming', value: features.handStimming || 'N/A' },
    { key: 'handGesture', label: 'Hand gestures', value: features.handGesture || 'N/A' },
    { key: 'socialReciprocity', label: 'Social reciprocity', value: features.socialReciprocity || 'N/A' },
    { key: 'emotionVariation', label: 'Emotion variation', value: features.emotionVariation || 'N/A' },
  ].map((item) => ({ ...item, concern: isConcern(item.key, item.value) }));

  return {
    child_name: screening?.child?.name || screening?.child?.nickname || 'N/A',
    child_age_months: screening?.child?.ageInMonths || 'N/A',
    risk_level: screening?.riskLevel || 'N/A',
    indicators,
    concern_count: indicators.filter((i) => i.concern).length,
    questionnaire_concerns: questionnaireConcerns,
  };
};

const detectIndicatorTopic = (question) => {
  const q = String(question || '').toLowerCase();
  if (/eye contact/.test(q)) return 'eyeContact';
  if (/head stimming|head movement/.test(q)) return 'headStimming';
  if (/hand stimming|hand movement/.test(q)) return 'handStimming';
  if (/gesture/.test(q)) return 'handGesture';
  if (/social reciprocity|social interaction/.test(q)) return 'socialReciprocity';
  if (/emotion|emotional expression/.test(q)) return 'emotionVariation';
  return null;
};

const buildRuleBasedIndicatorReply = (facts, indicatorKey) => {
  const item = facts.indicators.find((i) => i.key === indicatorKey);
  if (!item) return null;

  const interpretation = item.concern
    ? `${item.label} is showing a pattern that needs follow-up.`
    : `${item.label} is currently within expected range in this screening.`;

  return `Explanation:\nObserved ${item.label.toLowerCase()} status is "${item.value}".\n\nWhat it means:\n${interpretation}\n\nSuggested next steps:\n- Continue daily parent-child interaction activities.\n- Track this behavior over the next few weeks.\n- Discuss this finding in your specialist follow-up visit.`;
};

const ensureStructuredResponse = (text) => {
  const raw = String(text || '').trim();
  if (!raw) {
    return 'Explanation:\nI could not generate a response right now.\n\nWhat it means:\nPlease try again in a moment.\n\nSuggested next steps:\n- Retry your question.\n- If issue continues, contact support.';
  }

  const hasExplanation = /Explanation\s*:/i.test(raw);
  const hasMeaning = /What it means\s*:/i.test(raw);
  const hasSteps = /Suggested next steps\s*:/i.test(raw);

  if (hasExplanation && hasMeaning && hasSteps) return raw;

  return `Explanation:\n${raw}\n\nWhat it means:\nThis response is based on the available screening information.\n\nSuggested next steps:\n- Continue monitoring and ask follow-up questions.\n- Discuss concerns with a qualified specialist.`;
};

const buildPrompt = ({ systemData, verifiedFacts, retrievedChunks, question, history, intent, reportFound }) => {
  return `You are an autism support assistant.

Use the following information:

System Analysis:
${JSON.stringify(systemData, null, 2)}

Verified Facts (use these as primary truth):
${JSON.stringify(verifiedFacts, null, 2)}

Medical Report Context:
${retrievedChunks || 'No report context available.'}

Web App Workflow Guide:
${WEBAPP_GUIDE}

Conversation Context:
${history || 'No prior conversation.'}

User Question:
${question}

Detected Intent:
${intent}

Instructions:
- Answer in simple language for parents.
- Avoid medical jargon wherever possible.
- Do not mention AI, ML, model, algorithm, or system.
- Do not provide diagnosis.
- Be supportive, clear, and practical.
- If intent is "report" and answer is not in uploaded report context, clearly say: "This information is not present in the uploaded report."
- For report-specific questions, prioritize report context first.
- For app_guidance intent, explain exact click-by-click app usage clearly.
- For interpretation/recommendation intents, use system analysis strongly even when report context is missing.
- Do not invent details that are not present in Verified Facts or Medical Report Context.
- Keep response structured exactly as:

Explanation:
<simple explanation>

What it means:
<interpretation>

Suggested next steps:
<practical advice in 2-4 bullet points>

Additional safety constraints:
- Never claim definitive diagnosis.
- Keep total response concise and parent-friendly.
- If report context is missing for report intent, explicitly state missing report information and continue with general guidance.

Report context found:
${reportFound ? 'yes' : 'no'}`;
};

const formatHistory = (messages = []) => {
  return messages
    .slice(-8)
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'Parent'}: ${m.text}`)
    .join('\n');
};

const translateResponse = async (englishText, language) => {
  if (language === 'en') return englishText;

  const target = language === 'hi' ? 'Hindi' : 'Kannada';
  const prompt = `Translate the following response into ${target}.

Rules:
- Keep same meaning.
- Keep same section headings translated naturally.
- Keep bullet points.
- Do not add new medical claims.

Text:
${englishText}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 900,
  });

  return completion.choices?.[0]?.message?.content?.trim() || englishText;
};

exports.generateChatResponse = async ({ screening, question, language = 'en', chatHistory = [] }) => {
  const intent = getIntent(question);

  if (isDiagnosisQuestion(question)) {
    const safeReply = DIAGNOSIS_SAFETY_MESSAGE;
    const localized = await translateResponse(
      `Explanation:\n${safeReply}\n\nWhat it means:\nA specialist assessment is needed for diagnosis.\n\nSuggested next steps:\n- Book a developmental specialist consultation.\n- Share screening report during appointment.\n- Continue supportive activities at home.`,
      language
    );

    return { intent, answer: localized, englishAnswer: safeReply, reportContextUsed: false };
  }

  const systemData = toSystemData(screening);
  const verifiedFacts = buildVerifiedFacts(screening);
  const rag = await retrieveReportContext(screening?.reportPath, question, 3);

  const indicatorTopic = detectIndicatorTopic(question);
  if (indicatorTopic && intent === 'explanation') {
    const ruleBased = buildRuleBasedIndicatorReply(verifiedFacts, indicatorTopic);
    if (ruleBased) {
      const localized = await translateResponse(ruleBased, language);
      return {
        intent,
        answer: localized,
        englishAnswer: ruleBased,
        reportContextUsed: false,
        reportContextReason: null,
      };
    }
  }

  const prompt = buildPrompt({
    systemData,
    verifiedFacts,
    retrievedChunks: rag.context,
    question,
    history: formatHistory(chatHistory),
    intent,
    reportFound: rag.found,
  });

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are a compassionate autism support assistant for parents. Give high-quality practical guidance, follow response structure, and keep explanations specific to the provided child results.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.25,
    max_tokens: 1100,
  });

  const englishAnswer = completion.choices?.[0]?.message?.content?.trim() ||
    'Explanation:\nI could not generate a response right now.\n\nWhat it means:\nPlease try again in a moment.\n\nSuggested next steps:\n- Retry your question.\n- If issue continues, contact support.';

  const structuredEnglish = ensureStructuredResponse(englishAnswer);

  const localizedAnswer = await translateResponse(structuredEnglish, language);

  return {
    intent,
    answer: localizedAnswer,
    englishAnswer: structuredEnglish,
    reportContextUsed: rag.found,
    reportContextReason: rag.reason,
  };
};

exports.getSuggestedQuestions = () => {
  return [
    'Explain my results',
    'What should I do next?',
    'Therapy suggestions',
    'What does the uploaded report say?',
    'How can I improve eye contact?',
    'How do I use this web app step by step?'
  ];
};
