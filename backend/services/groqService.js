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

    const prompt = `You are a clinical psychologist specializing in autism spectrum disorder (ASD) assessment. Analyze the following autism screening results and provide a comprehensive, professional report.

**Child Information:**
- Age: ${child.ageInMonths} months (${Math.floor(child.ageInMonths / 12)} years)
- Gender: ${child.gender}

**Assessment Results:**
- Overall Risk Score: ${finalScore}%
- Risk Level: ${riskLevel}
- Questionnaire Responses: ${questionnaire.responses.length} questions answered
- Questionnaire Score: ${(questionnaire.score * 100).toFixed(1)}%

**Behavioral Observations from Video Analysis:**
${liveVideoFeatures ? `
- Eye Contact: ${liveVideoFeatures.eyeContactRatio ? (liveVideoFeatures.eyeContactRatio * 100).toFixed(1) + '% - ' + (liveVideoFeatures.eyeContactLevel || 'unknown') : 'Not measured'}
  ${liveVideoFeatures.eyeContactInterpretation || ''}
- Blink Rate: ${liveVideoFeatures.blinkRatePerMinute ? liveVideoFeatures.blinkRatePerMinute.toFixed(1) + ' blinks/min - ' + (liveVideoFeatures.blinkLevel || 'unknown') : 'Not measured'}
  ${liveVideoFeatures.blinkInterpretation || ''}
- Head Movement: ${liveVideoFeatures.headMovementRate ? liveVideoFeatures.headMovementRate.toFixed(4) + ' - ' + (liveVideoFeatures.headMovementLevel || 'unknown') : 'Not measured'}
  ${liveVideoFeatures.headMovementInterpretation || ''}
- Head Stimming: ${liveVideoFeatures.headMovements?.repetitive ? 'Present' : 'Absent'}
  ${liveVideoFeatures.headMovements?.description || ''}
- Hand Stimming: ${liveVideoFeatures.handStimming?.present ? 'Present (' + (liveVideoFeatures.handStimming.severity || 'unknown') + ')' : 'Absent'}
  ${liveVideoFeatures.handStimming?.description || ''}
- Social Gestures: ${liveVideoFeatures.socialGestures?.present ? 'Present (' + (liveVideoFeatures.socialGestures.frequency_per_minute || 0).toFixed(1) + '/min)' : 'Absent'}
  ${liveVideoFeatures.socialGestures?.description || ''}
- Facial Expression: ${liveVideoFeatures.facialExpressionVariability ? (liveVideoFeatures.facialExpressionVariability * 100).toFixed(1) + '% - ' + (liveVideoFeatures.expressionLevel || 'unknown') : 'Not measured'}
  ${liveVideoFeatures.expressionInterpretation || ''}
- Session Duration: ${liveVideoFeatures.sessionDuration ? Math.floor(liveVideoFeatures.sessionDuration / 60) + ' min ' + (liveVideoFeatures.sessionDuration % 60) + ' sec' : 'N/A'}
- Total Frames Analyzed: ${liveVideoFeatures.totalFrames || 'N/A'}
` : 'Video analysis data not available'}

**Questionnaire Responses Summary:**
- Total Questions: ${questionnaire.responses.length}
- Positive Indicators: ${questionnaire.responses.filter(r => r.answer === true).length}
- Concerning Indicators: ${questionnaire.responses.filter(r => r.answer === false).length}
- Jaundice at birth: ${questionnaire.jaundice}
- Family history of ASD: ${questionnaire.family_asd}

**Key Questionnaire Responses:**
${questionnaire.responses.slice(0, 10).map((r, i) => `${i+1}. ${r.question}: ${r.answer ? 'Yes' : 'No'}`).join('\n')}

Please provide a detailed analysis in the following structure:

1. **Executive Summary** (2-3 sentences): Brief overview of findings and risk level with specific behavioral observations

2. **What Are The Autism Indicators Here?**:
   - List the SPECIFIC behaviors/responses that suggest autism risk
   - Explain WHY each indicator is significant (how it relates to ASD criteria)
   - Which behaviors align with DSM-5 autism diagnostic criteria
   - Distinguish between typical development and concerning patterns

3. **Risk Assessment Explanation**: 
   - Explain the ${finalScore}% score calculation
   - Detail which specific behaviors/responses contributed most to the ${riskLevel} risk classification
   - Break down the weight of video analysis vs questionnaire
   - Clarify what this score means and doesn't mean

4. **Detailed Behavioral Analysis**:
   - Eye Contact & Social Communication: Interpret the ${liveVideoFeatures?.eyeContactRatio ? (liveVideoFeatures.eyeContactRatio * 100).toFixed(1) + '%' : 'N/A'} eye contact ratio and social gesture patterns
   - Repetitive Behaviors: Analyze head and hand stimming observations with clinical significance
   - Facial Expressions: Interpret emotional expression variability (${liveVideoFeatures?.facialExpressionVariability ? (liveVideoFeatures.facialExpressionVariability * 100).toFixed(1) + '%' : 'N/A'})
   - Communication Development: Based on questionnaire responses
   - Overall Developmental Profile: Synthesis of all assessment data

5. **Strengths Observed**: Highlight positive developmental indicators and capabilities

6. **Areas of Concern**: Specific behaviors that warrant attention, monitoring, or intervention

7. **What Should Parents Do? - Personalized Action Plan**:
   
   **IMMEDIATE ACTIONS (This Week):**
   - Specific steps parents should take NOW
   - Who to call first and what to say
   - Documentation to prepare
   
   **SHORT-TERM (Next 1-3 Months):**
   - Scheduled appointments and evaluations
   - Early intervention programs to contact
   - Home strategies to implement
   
   **WHOM TO CONTACT - In Order of Priority:**
   1. **Developmental Pediatrician** - Why: comprehensive medical evaluation
   2. **Child Psychologist/Psychiatrist** - Why: behavioral and diagnostic assessment
   3. **Speech-Language Pathologist** - Why: communication evaluation (if applicable)
   4. **Occupational Therapist** - Why: sensory/motor assessment (if applicable)
   5. **Early Intervention Services** - Why: state-funded support programs
   6. **Applied Behavior Analysis (ABA) Provider** - Why: evidence-based therapy
   
   Include specific guidance on how to find these specialists and what to expect.

8. **Hospital & Autism Center Recommendations**:
   Based on the ${riskLevel} risk level, recommend top 3-5 hospitals/centers:
   - Names of major children's hospitals with autism programs
   - University-affiliated autism centers
   - Specialized autism diagnostic clinics
   - Why each is recommended for this specific case
   - Services they provide (diagnostic evaluation, therapy, family support)
   - Typical wait times and how to expedite if high risk

9. **Support Resources for Parents**:
   - Parent support groups and communities
   - Educational resources, books, and websites
   - Online communities (autism parent forums)
   - Financial assistance and insurance navigation
   - School/IEP support resources

10. **Timeline & Monitoring Plan**:
   - When to seek evaluation: ${riskLevel === 'High' ? 'URGENT (within 1-2 weeks)' : riskLevel === 'Moderate' ? 'Schedule within 1-2 months' : 'Monitor and re-screen if concerns arise'}
   - Follow-up assessment schedule
   - Developmental milestones to monitor monthly
   - Red flags that require immediate attention

11. **Important Disclaimer**: This is a screening tool, not a diagnosis. Only qualified healthcare professionals can diagnose autism. Professional evaluation is essential for accurate assessment and treatment planning.

Keep the tone professional, compassionate, evidence-based, and hopeful. Use the specific measurements and observations provided. Focus on actionable guidance and empowerment for parents. Be VERY specific about next steps and whom to contact.`;

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
