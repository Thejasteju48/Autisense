const Groq = require('groq-sdk');

// Trim API key to remove any whitespace
const apiKey = (process.env.GROQ_API_KEY || '').trim();

if (!apiKey) {
  console.error('⚠️ GROQ_API_KEY is not set in environment variables');
}

const groq = new Groq({
  apiKey: apiKey
});

/**
 * Generate enhanced screening analysis using Groq LLM
 */
exports.generateScreeningAnalysis = async (screeningData) => {
  try {
    const { finalScore, riskLevel, questionnaire, liveVideoFeatures, child } = screeningData;

    const prompt = `You are a clinical psychologist specializing in autism spectrum disorder (ASD) assessment. Analyze the following screening data and produce a concise, standard clinical explanation.

Child Information:
- Age: ${child.ageInMonths} months (${Math.floor(child.ageInMonths / 12)} years)
- Gender: ${child.gender}

Assessment Results:
- Overall Risk Score: ${Number(finalScore || 0).toFixed(1)}%
- Risk Level: ${riskLevel}
- Questionnaire Responses: ${questionnaire.responses.length} questions answered
- Questionnaire Score: ${(questionnaire.score * 100).toFixed(1)}%

Behavioral Observations from Video Analysis:
${liveVideoFeatures ? `
- Eye Contact: ${liveVideoFeatures.eyeContact || 'Unknown'}
- Head Stimming: ${liveVideoFeatures.headStimming || 'Unknown'}
- Hand Stimming: ${liveVideoFeatures.handStimming || 'Unknown'}
- Hand Gesture: ${liveVideoFeatures.handGesture || 'Unknown'}
- Social Reciprocity: ${liveVideoFeatures.socialReciprocity || 'Unknown'}
- Emotion Variation: ${liveVideoFeatures.emotionVariation || 'Unknown'}
- Session Duration: ${liveVideoFeatures.sessionDuration ? Math.floor(liveVideoFeatures.sessionDuration / 60) + ' min ' + (liveVideoFeatures.sessionDuration % 60) + ' sec' : 'N/A'}
` : 'Video analysis data not available'}

Questionnaire Responses Summary:
- Total Questions: ${questionnaire.responses.length}
- Positive Indicators: ${questionnaire.responses.filter(r => r.answer === true).length}
- Concerning Indicators: ${questionnaire.responses.filter(r => r.answer === false).length}
- Jaundice at birth: ${questionnaire.jaundice}
- Family history of ASD: ${questionnaire.family_asd}

Key Questionnaire Responses:
${questionnaire.responses.slice(0, 10).map((r, i) => `${i+1}. ${r.question}: ${r.answer ? 'Yes' : 'No'}`).join('\n')}

Return output in PLAIN TEXT ONLY using EXACTLY this structure (no markdown symbols, no **, no tables, no emojis, no extra sections):

1. Executive Summary
- 2 to 3 short sentences.
- Mention risk level and the most important observed behaviors.

2. Autism Indicators Identified
- Provide 4 to 7 bullet points.
- Each bullet must include: observed sign + brief clinical relevance.

3. Risk Assessment Interpretation
- Explain why the score is ${Number(finalScore || 0).toFixed(1)}% and ${riskLevel} risk.
- Mention questionnaire and video weighting.
- Clarify this is screening, not diagnosis.

4. Behavioral Domain Analysis
- Eye Contact and Social Reciprocity: short interpretation.
- Repetitive Behaviors: short interpretation.
- Gestures and Communication: short interpretation.
- Emotional Expression: short interpretation.

5. Strengths Observed
- Provide 2 to 4 concise bullet points.

6. Areas of Concern
- Provide 3 to 6 concise bullet points.

7. Parent Action Plan
- Immediate Actions (This Week): 3 to 5 bullets.
- Next 1 to 3 Months: 3 to 5 bullets.
- Priority Specialists to Contact: numbered list with reason for each.

8. Monitoring and Follow-Up Timeline
- Include evaluation timing, follow-up interval, and red flags.

9. Parent Support Resources
- Provide 3 to 6 practical resources/categories.

10. Important Disclaimer
- One short paragraph stating this is screening guidance, not a diagnosis.

Rules:
- Keep language professional, compassionate, and clear.
- Keep bullets concise and point-wise.
- Use hyphen bullets only: "- " for all point lists.
- Do not use markdown emphasis markers such as ** or __.
- Use at most one decimal place for numeric values.
- Do not invent named hospitals or exact wait times.
- Keep total output between 700 and 1100 words.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert clinical psychologist specializing in autism spectrum disorder assessment and early intervention. Provide clear, compassionate, evidence-based guidance.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
      temperature: 0.3, // Lower temperature for more consistent, professional output
      max_tokens: 2048,
      top_p: 1
    });

    return {
      success: true,
      analysis: chatCompletion.choices[0].message.content,
      tokens: chatCompletion.usage
    };

  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Failed to generate LLM analysis: ${error.message}`);
  }
};

/**
 * Generate a brief summary for quick display
 */
exports.generateQuickSummary = async (screeningData) => {
  try {
    const { finalScore, riskLevel, child } = screeningData;

    const prompt = `Provide a brief, compassionate 2-3 sentence summary for parents about their child's autism screening results:
- Risk Score: ${finalScore}%
- Risk Level: ${riskLevel}
- Child Age: ${Math.floor(child.ageInMonths / 12)} years

Keep it clear, supportive, and emphasize next steps.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 200
    });

    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error('Groq API error:', error);
    return `Based on the screening assessment, your child shows a ${riskLevel.toLowerCase()} risk level for autism spectrum disorder. We recommend consulting with a pediatric specialist for further evaluation.`;
  }
};

/**
 * Generate short parent-friendly explanations (≤80 words each) for each behavioral indicator.
 * Returns an object keyed by indicator name.
 */
exports.generateIndicatorExplanations = async (liveVideoFeatures) => {
  const indicators = [
    { key: 'eyeContact',        label: liveVideoFeatures.eyeContact,        display: 'Eye Contact' },
    { key: 'headStimming',      label: liveVideoFeatures.headStimming,       display: 'Head Stimming' },
    { key: 'handStimming',      label: liveVideoFeatures.handStimming,       display: 'Hand Stimming' },
    { key: 'handGesture',       label: liveVideoFeatures.handGesture,        display: 'Hand Gesture' },
    { key: 'socialReciprocity', label: liveVideoFeatures.socialReciprocity,  display: 'Social Reciprocity' },
    { key: 'emotionVariation',  label: liveVideoFeatures.emotionVariation,   display: 'Emotion Variation' },
  ];

  const results = {};
  const fallbacks = {
    eyeContact:        'Eye contact is an important part of social communication. The screening measured how consistently the child looked toward the camera during the session.',
    headStimming:      'Head stimming refers to repetitive head movements (rocking or shaking). The screening analyzed movement patterns to determine if such behaviors were present.',
    handStimming:      'Hand stimming includes repetitive flapping or wringing motions. The screening tracked hand movement frequency and pattern to detect these behaviors.',
    handGesture:       'Communicative hand gestures such as waving, pointing, or reaching show social intent. The screening checked whether the child used such purposeful gestures.',
    socialReciprocity: 'Social reciprocity is the ability to engage and respond to others. The screening assessed body orientation and interaction cues during the session.',
    emotionVariation:  'Emotion variation reflects the range of facial expressions a child shows. The screening measured whether the child displayed a healthy diversity of expressions.',
  };

  for (const item of indicators) {
    try {
      const prompt = `Explain the autism behavioral screening indicator "${item.display}" (result observed: "${item.label}") to parents in simple, compassionate medical language. Keep the explanation under 80 words. Focus on what this indicator means, why it is relevant for autism screening, and what the observed result suggests.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 150,
      });

      results[item.key] = response.choices[0].message.content.trim();
    } catch (err) {
      console.error(`Groq explanation error for ${item.key}:`, err.message);
      results[item.key] = fallbacks[item.key];
    }
  }

  return results;
};
