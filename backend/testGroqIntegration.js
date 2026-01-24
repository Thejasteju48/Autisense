/**
 * Test script for Groq API integration
 * 
 * Usage:
 * 1. Ensure GROQ_API_KEY is set in .env
 * 2. Run: node testGroqIntegration.js
 */

require('dotenv').config();
const groqService = require('./services/groqService');

// Mock screening data for testing
const mockScreeningData = {
  finalScore: 65.5,
  riskLevel: 'Moderate',
  questionnaire: {
    responses: [
      { questionId: 1, question: 'Does the child make eye contact?', answer: true },
      { questionId: 2, question: 'Does the child respond to their name?', answer: false },
      // ... (simulating 20 responses)
    ],
    score: 0.6,
    jaundice: 'no',
    family_asd: 'yes'
  },
  liveVideoFeatures: {
    eye_contact_ratio: 0.45,
    blink_rate: 18,
    head_movement_rate: 0.23,
    repetitive_behaviors: true,
    gesture_count: 5,
    expression_variability: 0.3
  },
  child: {
    name: 'Test Child',
    ageInMonths: 36,
    gender: 'male'
  }
};

async function testGroqIntegration() {
  console.log('🧪 Testing Groq API Integration...\n');

  // Check if API key is configured
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ ERROR: GROQ_API_KEY not found in .env file');
    console.log('\n📝 To fix this:');
    console.log('1. Get API key from: https://console.groq.com/');
    console.log('2. Add to .env file: GROQ_API_KEY=gsk_your_key_here');
    console.log('3. Run this test again\n');
    process.exit(1);
  }

  console.log('✓ GROQ_API_KEY found in environment\n');

  // Test 1: Generate Quick Summary
  console.log('Test 1: Generating quick summary...');
  try {
    const quickSummary = await groqService.generateQuickSummary(mockScreeningData);
    console.log('✅ Quick Summary Generated:');
    console.log(quickSummary);
    console.log();
  } catch (error) {
    console.error('❌ Quick Summary Failed:', error.message);
    console.log();
  }

  // Test 2: Generate Full Analysis
  console.log('Test 2: Generating full clinical analysis...');
  try {
    const analysisResult = await groqService.generateScreeningAnalysis(mockScreeningData);
    
    if (analysisResult.success) {
      console.log('✅ Full Analysis Generated Successfully!');
      console.log('\n--- LLM Analysis Preview (first 500 chars) ---');
      console.log(analysisResult.analysis.substring(0, 500) + '...');
      console.log('\n--- Token Usage ---');
      console.log(`Prompt tokens: ${analysisResult.tokens.prompt_tokens}`);
      console.log(`Completion tokens: ${analysisResult.tokens.completion_tokens}`);
      console.log(`Total tokens: ${analysisResult.tokens.total_tokens}`);
      console.log();
    } else {
      console.error('❌ Analysis generation failed');
    }
  } catch (error) {
    console.error('❌ Full Analysis Failed:', error.message);
    console.log();
    
    if (error.message.includes('API key')) {
      console.log('💡 Tip: Check if your API key is valid at https://console.groq.com/');
    } else if (error.message.includes('rate limit')) {
      console.log('💡 Tip: You may have exceeded Groq rate limits. Wait a moment and try again.');
    }
  }

  console.log('\n✅ Groq Integration Test Complete!\n');
  console.log('📄 Next Steps:');
  console.log('1. Complete a real screening in the app');
  console.log('2. Check backend logs for: "✓ Generated LLM analysis using Groq API"');
  console.log('3. View results page to see AI-Enhanced Clinical Analysis');
  console.log('4. Download PDF report to see full formatted output\n');
}

// Run the test
testGroqIntegration().catch(console.error);
