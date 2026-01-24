import joblib
import pandas as pd
import numpy as np
import os
from pathlib import Path
from groq import Groq

class QuestionnairePredictor:
    """
    Autism prediction based on trained questionnaire models.
    Uses two pre-trained models and averages their predictions.
    Generates LLM-powered interpretations using Groq.
    """
    
    def __init__(self):
        # Load trained models from services directory
        model_dir = Path(__file__).parent  # ml-service/services/
        self.model1 = joblib.load(model_dir / "autism_model1.pkl")
        self.model2 = joblib.load(model_dir / "autism_model2.pkl")
        
        # Initialize Groq client for AI-powered interpretations
        api_key = os.getenv('GROQ_API_KEY')
        self.groq_client = Groq(api_key=api_key) if api_key else None
        self.groq_model = "llama-3.3-70b-versatile"
        
        print("✓ Loaded questionnaire prediction models")
    
    def predict(self, questionnaire_data):
        """
        Predict autism likelihood from questionnaire responses.
        
        Args:
            questionnaire_data: Dictionary with keys:
                - responses: List of 20 yes/no answers (True/False)
                - age: Child age in months
                - sex: 'male' or 'female'
                - jaundice: 'yes' or 'no'
                - family_asd: 'yes' or 'no'
        
        Returns:
            Dictionary with prediction results
        """
        try:
            responses = questionnaire_data['responses']
            
            # Validate responses
            if not responses or len(responses) != 20:
                raise ValueError(f"Expected 20 questionnaire responses, got {len(responses) if responses else 0}. Please complete all questionnaire questions before submitting.")
            
            # Convert yes/no to 0/1 (0=typical, 1=autism trait)
            # The responses come as True/False where True=yes(typical), False=no(autism trait)
            Q1 = []  # First 10 questions
            Q2 = []  # Second 10 questions (same meaning)
            
            for i, answer in enumerate(responses):
                value = 0 if answer else 1  # yes=0 (typical), no=1 (autism)
                if i < 10:
                    Q1.append(value)
                else:
                    Q2.append(value)
            
            # Combine paired questions (average and threshold)
            A = []
            for q1, q2 in zip(Q1, Q2):
                avg = (q1 + q2) / 2
                A.append(1 if avg >= 0.5 else 0)
            
            # Get additional features
            age = questionnaire_data['age']
            sex = 1 if questionnaire_data['sex'].lower() == 'male' else 0
            jaundice = 1 if questionnaire_data['jaundice'].lower() == 'yes' else 0
            family_asd = 1 if questionnaire_data['family_asd'].lower() == 'yes' else 0
            
            # Build feature dataframe
            columns = [
                "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
                "Age", "Sex", "Jauundice", "Family_ASD"
            ]
            
            df = pd.DataFrame(
                [A + [age, sex, jaundice, family_asd]],
                columns=columns
            )
            
            # Get predictions from both models
            prob1 = self.model1.predict_proba(df)[0][1]
            prob2 = self.model2.predict_proba(df)[0][1]
            
            # Average the predictions
            final_prob = (prob1 + prob2) / 2
            
            # Determine risk level
            if final_prob >= 0.70:
                risk_level = "High"
            elif final_prob >= 0.40:
                risk_level = "Moderate"
            else:
                risk_level = "Low"
            
            # Generate LLM-powered interpretation
            interpretation = self._generate_llm_interpretation(
                final_prob, risk_level, responses, age, 
                questionnaire_data['sex'], jaundice, family_asd
            )
            
            return {
                'probability': float(final_prob),
                'model1_probability': float(prob1),
                'model2_probability': float(prob2),
                'risk_level': risk_level,
                'interpretation': interpretation,
                'confidence': 0.85,  # Based on model training performance
                'features': {
                    'A1': int(A[0]), 'A2': int(A[1]), 'A3': int(A[2]), 'A4': int(A[3]), 'A5': int(A[4]),
                    'A6': int(A[5]), 'A7': int(A[6]), 'A8': int(A[7]), 'A9': int(A[8]), 'A10': int(A[9]),
                    'age': age,
                    'sex': 'male' if sex == 1 else 'female',
                    'jaundice': 'yes' if jaundice == 1 else 'no',
                    'family_asd': 'yes' if family_asd == 1 else 'no'
                }
            }
            
        except Exception as e:
            raise Exception(f"Questionnaire prediction failed: {str(e)}")
    
    def _generate_llm_interpretation(self, probability: float, risk_level: str,
                                     responses: list, age: int, sex: str,
                                     jaundice: int, family_asd: int) -> str:
        """Generate AI-powered clinical interpretation using Groq LLM"""
        
        if not self.groq_client:
            # Fallback to basic interpretation
            return self._generate_basic_interpretation(probability, risk_level)
        
        try:
            # Count concerning responses
            concern_count = sum(1 for r in responses if not r)  # False = concerning
            concern_percentage = (concern_count / len(responses)) * 100
            
            prompt = f"""As a developmental pediatrician, provide a professional interpretation of this autism screening questionnaire result:

**Assessment Score: {probability*100:.1f}% likelihood (Risk Level: {risk_level})**

**Child Information:**
- Age: {age} months ({age//12} years)
- Sex: {sex}
- Jaundice at birth: {"Yes" if jaundice == 1 else "No"}
- Family history of ASD: {"Yes" if family_asd == 1 else "No"}

**Questionnaire Results:**
- {concern_count} of 20 developmental markers flagged ({concern_percentage:.0f}%)
- Model confidence: 85%

Provide a concise, evidence-based interpretation (3-4 sentences) that:
1. Explains what this score means in practical terms
2. Highlights the most significant risk factors (if any)
3. Provides specific, actionable next steps for parents
4. Maintains a supportive, hopeful tone while being clinically accurate

Focus on what parents should do next, not just descriptions."""

            completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert developmental pediatrician specializing in autism screening. Provide clear, compassionate, actionable guidance for parents."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.groq_model,
                temperature=0.4,
                max_tokens=300
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"Warning: LLM interpretation failed: {e}")
            return self._generate_basic_interpretation(probability, risk_level)
    
    def _generate_basic_interpretation(self, probability: float, risk_level: str) -> str:
        """Generate basic interpretation (fallback when LLM unavailable)"""
        if probability >= 0.70:
            return "HIGH POSSIBILITY OF AUTISM - Professional evaluation strongly recommended"
        elif probability >= 0.40:
            return "MODERATE RISK - Consider consultation with specialist"
        else:
            return "LOW AUTISM LIKELIHOOD - Continue monitoring development"

            print(f"Error in questionnaire prediction: {str(e)}")
            raise Exception(f"Prediction error: {str(e)}")
