const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
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
- Eye Contact: ${liveVideoFeatures.eye_contact_ratio ? (liveVideoFeatures.eye_contact_ratio * 100).toFixed(1) + '%' : 'Not measured'}
- Blink Rate: ${liveVideoFeatures.blink_rate || 'Not measured'}
- Head Movement Rate: ${liveVideoFeatures.head_movement_rate || 'Not measured'}
- Repetitive Behaviors Detected: ${liveVideoFeatures.repetitive_behaviors ? 'Yes' : 'No'}
- Gesture Detection: ${liveVideoFeatures.gesture_count || 0} gestures observed
- Expression Variability: ${liveVideoFeatures.expression_variability || 'Not measured'}
` : 'Video analysis data not available'}

**Questionnaire Indicators:**
- Jaundice at birth: ${questionnaire.jaundice}
- Family history of ASD: ${questionnaire.family_asd}

Please provide a detailed analysis in the following structure:

1. **Executive Summary** (2-3 sentences): Brief overview of findings and risk level
2. **Key Findings** (bullet points): 4-6 specific observations from the assessment
3. **Behavioral Analysis**: Detailed interpretation of video observations and questionnaire responses
4. **Developmental Concerns**: Specific areas that warrant attention or monitoring
5. **Recommendations**: 
   - Immediate next steps
   - Recommended specialists or assessments
   - Supportive strategies for parents
6. **Important Note**: Emphasize this is a screening tool, not a diagnostic tool

Keep the tone professional, compassionate, and hopeful. Focus on actionable guidance for parents.`;

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
