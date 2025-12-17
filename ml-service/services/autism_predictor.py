import numpy as np
from typing import Dict
import os
from groq import Groq

class AutismPredictor:
    """
    Combines all behavioral features and questionnaire to predict autism likelihood.
    Uses weighted fusion algorithm with evidence-based weights.
    """
    
    def __init__(self):
        # Feature weights based on clinical research
        self.weights = {
            'eye_contact': 0.22,      # Eye contact is a key indicator
            'smile': 0.18,            # Social smiling is significant
            'gesture': 0.18,          # Gesture usage is important
            'repetitive': 0.18,       # Repetitive behaviors are characteristic
            'imitation': 0.14,        # Imitation ability is important for social learning
            'questionnaire': 0.10     # Parent observations provide context
        }
        
        # Initialize Groq client for AI-powered interpretations
        api_key = os.getenv('GROQ_API_KEY')
        self.groq_client = Groq(api_key=api_key) if api_key else None
        self.groq_model = "llama-3.3-70b-versatile"  # Fast and accurate model
    
    def calculate_eye_contact_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from eye contact data.
        Lower ratio = higher score (less eye contact is concerning)
        """
        ratio = data.get('ratio', 0.5)
        alignment = data.get('alignment', 0.5)
        
        # Inverse relationship: low eye contact = high score
        contact_score = (1 - ratio) * 0.7
        
        # Poor alignment adds to score
        alignment_score = (1 - alignment) * 0.3
        
        total = (contact_score + alignment_score) * 100
        return min(total, 100)
    
    def calculate_gesture_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from gesture data.
        Lower frequency = higher score (limited gestures is concerning)
        """
        frequency = data.get('frequency', 0)
        wave_count = data.get('waveCount', 0)
        point_count = data.get('pointCount', 0)
        
        # Expected gestures in typical development
        EXPECTED_GESTURES = 5
        
        # Calculate deficit
        gesture_deficit = max(0, EXPECTED_GESTURES - frequency) / EXPECTED_GESTURES
        
        # Lack of specific gestures adds to score
        if wave_count == 0:
            gesture_deficit += 0.2
        if point_count == 0:
            gesture_deficit += 0.2
        
        total = min(gesture_deficit, 1.0) * 100
        return total
    
    def calculate_smile_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from smile data.
        Lower smile ratio and frequency = higher score
        """
        ratio = data.get('ratio', 0)
        frequency = data.get('frequency', 0)
        
        # Typical children smile frequently during interactive games
        EXPECTED_SMILE_RATIO = 0.5
        EXPECTED_SMILE_FREQ = 5
        
        ratio_deficit = max(0, EXPECTED_SMILE_RATIO - ratio) / EXPECTED_SMILE_RATIO
        freq_deficit = max(0, EXPECTED_SMILE_FREQ - frequency) / EXPECTED_SMILE_FREQ
        
        total = ((ratio_deficit * 0.6) + (freq_deficit * 0.4)) * 100
        return total
    
    def calculate_repetitive_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from repetitive behavior data.
        Higher ratio and oscillations = higher score
        """
        ratio = data.get('ratio', 0)
        oscillations = data.get('oscillationCount', 0)
        
        # Repetitive behaviors are directly concerning
        ratio_score = ratio * 60
        
        # High oscillation count adds to score
        oscillation_score = min(oscillations / 10, 1.0) * 40
        
        total = ratio_score + oscillation_score
        return min(total, 100)
    
    def calculate_imitation_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from imitation data.
        Lower imitation score = higher likelihood (poor imitation is concerning)
        """
        score = data.get('score', 0)
        successful = data.get('successfulImitations', 0)
        total = data.get('totalAttempts', 4)
        delay = data.get('averageDelay', 0)
        
        # Inverse relationship: low imitation = high score
        imitation_deficit = (1 - score) * 70
        
        # Long delays add to score
        delay_score = min(delay / 5000, 1.0) * 30  # normalize to 5 seconds
        
        total = imitation_deficit + delay_score
        return min(total, 100)
    
    def calculate_questionnaire_score(self, data: Dict[str, float]) -> float:
        """
        Calculate autism likelihood from questionnaire.
        Higher score (more "yes" answers) = higher likelihood
        """
        score = data.get('score', 0)
        
        # Questionnaire score is already normalized 0-1
        return score * 100
    
    def predict(self, eye_contact_data: Dict, smile_data: Dict, 
                gesture_data: Dict, repetitive_data: Dict, 
                imitation_data: Dict, questionnaire_data: Dict) -> Dict:
        """
        Generate final autism likelihood prediction.
        
        Returns:
            Dictionary with prediction results and interpretation
        """
        # Calculate individual scores
        eye_score = self.calculate_eye_contact_score(eye_contact_data)
        smile_score = self.calculate_smile_score(smile_data)
        gesture_score = self.calculate_gesture_score(gesture_data)
        repetitive_score = self.calculate_repetitive_score(repetitive_data)
        imitation_score = self.calculate_imitation_score(imitation_data)
        questionnaire_score = self.calculate_questionnaire_score(questionnaire_data)
        
        # Weighted fusion
        autism_likelihood = (
            eye_score * self.weights['eye_contact'] +
            smile_score * self.weights['smile'] +
            gesture_score * self.weights['gesture'] +
            repetitive_score * self.weights['repetitive'] +
            imitation_score * self.weights['imitation'] +
            questionnaire_score * self.weights['questionnaire']
        )
        
        # Determine risk level
        risk_level = self._determine_risk_level(autism_likelihood)
        
        # Generate interpretation
        interpretation = self._generate_interpretation(
            autism_likelihood,
            eye_score, smile_score, gesture_score, 
            repetitive_score, imitation_score, questionnaire_score,
            eye_contact_data, smile_data, gesture_data, 
            repetitive_data, imitation_data
        )
        
        return {
            'autismLikelihood': round(autism_likelihood, 2),
            'riskLevel': risk_level,
            'interpretation': interpretation,
            'componentScores': {
                'eyeContact': round(eye_score, 2),
                'smile': round(smile_score, 2),
                'gesture': round(gesture_score, 2),
                'repetitive': round(repetitive_score, 2),
                'imitation': round(imitation_score, 2),
                'questionnaire': round(questionnaire_score, 2)
            }
        }
    
    def _determine_risk_level(self, likelihood: float) -> str:
        """Determine risk level from likelihood score"""
        if likelihood < 30:
            return 'Low'
        elif likelihood < 60:
            return 'Moderate'
        else:
            return 'High'
    
    def _generate_interpretation(self, likelihood: float, 
                                  eye_score: float, smile_score: float,
                                  gesture_score: float, repetitive_score: float,
                                  imitation_score: float, questionnaire_score: float,
                                  eye_data: Dict, smile_data: Dict,
                                  gesture_data: Dict, repetitive_data: Dict,
                                  imitation_data: Dict) -> Dict:
        """Generate comprehensive interpretation using Groq AI"""
        
        risk = self._determine_risk_level(likelihood)
        
        # Use Groq AI for intelligent interpretation if available
        if self.groq_client:
            try:
                return self._generate_ai_interpretation(
                    likelihood, risk, eye_score, smile_score, gesture_score,
                    repetitive_score, imitation_score, questionnaire_score, 
                    eye_data, smile_data, gesture_data,
                    repetitive_data, imitation_data
                )
            except Exception as e:
                print(f"Groq AI error: {e}. Falling back to rule-based interpretation.")
                # Fall back to rule-based if Groq fails
        
        # Fallback: Rule-based interpretation
        return self._generate_rule_based_interpretation(
            likelihood, risk, eye_score, smile_score, gesture_score,
            repetitive_score, imitation_score, questionnaire_score, 
            eye_data, smile_data, gesture_data,
            repetitive_data, imitation_data
        )
    
    def _generate_ai_interpretation(self, likelihood: float, risk: str,
                                    eye_score: float, smile_score: float,
                                    gesture_score: float, repetitive_score: float,
                                    imitation_score: float, questionnaire_score: float,
                                    eye_data: Dict, smile_data: Dict,
                                    gesture_data: Dict, repetitive_data: Dict,
                                    imitation_data: Dict) -> Dict:
        """Use Groq AI to generate personalized interpretations"""
        
        # Prepare data summary for AI
        data_summary = f"""
Autism Screening Analysis Results:

OVERALL:
- Autism Likelihood: {likelihood:.1f}%
- Risk Level: {risk}

BEHAVIORAL OBSERVATIONS:
1. Eye Contact (Score: {eye_score:.1f}/100):
   - Eye contact ratio: {eye_data.get('ratio', 0):.2f} ({int(eye_data.get('ratio', 0)*100)}% of frames)
   - Alignment score: {eye_data.get('alignment', 0):.2f}

2. Social Smiling (Score: {smile_score:.1f}/100):
   - Smile ratio: {smile_data.get('ratio', 0):.2f} ({int(smile_data.get('ratio', 0)*100)}% of frames)
   - Smile frequency: {smile_data.get('frequency', 0)} distinct events

3. Gesture Usage (Score: {gesture_score:.1f}/100):
   - Total gestures detected: {gesture_data.get('frequency', 0)}
   - Wave count: {gesture_data.get('waveCount', 0)}
   - Point count: {gesture_data.get('pointCount', 0)}

4. Repetitive Behaviors (Score: {repetitive_score:.1f}/100):
   - Repetitive ratio: {repetitive_data.get('ratio', 0):.2f}
   - Oscillation count: {repetitive_data.get('oscillationCount', 0)}

5. Imitation Ability (Score: {imitation_score:.1f}/100):
   - Imitation score: {imitation_data.get('score', 0):.2f}
   - Successful imitations: {imitation_data.get('successfulImitations', 0)}/{imitation_data.get('totalAttempts', 4)}
   - Average response delay: {imitation_data.get('averageDelay', 0):.0f}ms

6. Questionnaire (Score: {questionnaire_score:.1f}/100)

Child Age Range: 1-6 years (toddler/preschool)
"""

        # Generate comprehensive interpretation
        prompt = f"""{data_summary}

As a pediatric developmental specialist, provide a comprehensive autism screening interpretation:

1. SUMMARY (2-3 sentences): Overall assessment of the child's developmental profile and what the likelihood percentage means.

2. EYE CONTACT INSIGHTS (1-2 sentences): Interpret the eye contact data in the context of typical development.

3. SMILE INSIGHTS (1-2 sentences): Interpret social smiling patterns and emotional responsiveness.

4. GESTURE INSIGHTS (1-2 sentences): Explain what the gesture patterns indicate about non-verbal communication development.

5. REPETITIVE BEHAVIOR INSIGHTS (1-2 sentences): Explain repetitive behavior observations in developmental context.

6. IMITATION INSIGHTS (1-2 sentences): Interpret imitation ability in the context of social learning and development.

7. QUESTIONNAIRE INSIGHTS (1 sentence): Contextualize parent observations.

Be empathetic, clear, and balanced. Use plain language that parents can understand. Avoid medical jargon. Always emphasize that this is a screening tool, not a diagnosis."""

        # Call Groq API
        response = self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000
        )
        
        ai_response = response.choices[0].message.content
        
        # Parse AI response into structured format
        interpretation = self._parse_ai_response(ai_response)
        
        # Generate recommendations using AI
        recommendations = self._generate_ai_recommendations(likelihood, risk, data_summary)
        interpretation['recommendations'] = recommendations
        
        return interpretation
    
    def _parse_ai_response(self, ai_text: str) -> Dict:
        """Parse AI response into structured interpretation"""
        sections = {
            'summary': '',
            'eyeContactInsights': '',
            'gestureInsights': '',
            'smileInsights': '',
            'repetitiveInsights': '',
            'questionnaireInsights': ''
        }
        
        # Simple parsing by looking for section markers
        lines = ai_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Detect section headers
            if 'SUMMARY' in line.upper() or line.startswith('1.'):
                current_section = 'summary'
            elif 'EYE CONTACT' in line.upper() or line.startswith('2.'):
                current_section = 'eyeContactInsights'
            elif 'GESTURE' in line.upper() or line.startswith('3.'):
                current_section = 'gestureInsights'
            elif 'SMILE' in line.upper() or 'SMILING' in line.upper() or line.startswith('4.'):
                current_section = 'smileInsights'
            elif 'REPETITIVE' in line.upper() or line.startswith('5.'):
                current_section = 'repetitiveInsights'
            elif 'QUESTIONNAIRE' in line.upper() or line.startswith('6.'):
                current_section = 'questionnaireInsights'
            elif current_section and not line[0].isdigit():
                # Add content to current section
                sections[current_section] += line + ' '
        
        # Clean up sections
        for key in sections:
            sections[key] = sections[key].strip()
        
        return sections
    
    def _generate_ai_recommendations(self, likelihood: float, risk: str, data_summary: str) -> list:
        """Generate personalized recommendations using Groq AI"""
        
        prompt = f"""{data_summary}

Risk Level: {risk}
Likelihood: {likelihood:.1f}%

As a pediatric specialist, provide 5-7 specific, actionable recommendations for the parents based on this screening result. 
Recommendations should be:
- Practical and immediately actionable
- Appropriate for the risk level ({risk})
- Evidence-based and clinically sound
- Supportive and non-alarmist
- Include both immediate steps and long-term guidance

Format each recommendation as a single clear sentence. Always include the disclaimer as the last recommendation."""

        response = self.groq_client.chat.completions.create(
            model=self.groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800
        )
        
        ai_recommendations = response.choices[0].message.content
        
        # Parse recommendations (split by lines or numbered items)
        recommendations = []
        for line in ai_recommendations.split('\n'):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering/bullets
                clean_line = line.lstrip('0123456789.-•) ').strip()
                if clean_line:
                    recommendations.append(clean_line)
        
        # Always add disclaimer if not present
        disclaimer = "⚠️ IMPORTANT: This is a screening tool, NOT a diagnosis. Only qualified healthcare professionals can diagnose autism."
        if not any('screening tool' in r.lower() or 'not a diagnosis' in r.lower() for r in recommendations):
            recommendations.append(disclaimer)
        
        return recommendations[:8]  # Limit to 8 recommendations
    
    def _generate_rule_based_interpretation(self, likelihood: float, risk: str,
                                           eye_score: float, gesture_score: float,
                                           smile_score: float, repetitive_score: float,
                                           questionnaire_score: float,
                                           eye_data: Dict, gesture_data: Dict,
                                           smile_data: Dict, repetitive_data: Dict) -> Dict:
        """Fallback rule-based interpretation"""
        
        # Summary
        if risk == 'Low':
            summary = f"Based on interactive assessments, the screening indicates a LOW likelihood ({likelihood:.1f}%) of autism-related behaviors. The child demonstrated age-appropriate social communication and behavioral patterns."
        elif risk == 'Moderate':
            summary = f"Based on interactive assessments, the screening indicates a MODERATE likelihood ({likelihood:.1f}%) of autism-related behaviors. Some atypical patterns were observed that warrant further professional evaluation."
        else:
            summary = f"Based on interactive assessments, the screening indicates a HIGH likelihood ({likelihood:.1f}%) of autism-related behaviors. Multiple concerning patterns were observed. Professional diagnostic evaluation is strongly recommended."
        
        # Eye contact insights
        eye_ratio = eye_data.get('ratio', 0)
        if eye_score > 60:
            eye_insights = f"Eye contact was limited ({int(eye_ratio*100)}% of frames), which may indicate difficulty with social gaze typical in autism."
        elif eye_score > 30:
            eye_insights = f"Eye contact was inconsistent ({int(eye_ratio*100)}% of frames), showing some variability that may benefit from monitoring."
        else:
            eye_insights = f"Eye contact was appropriate ({int(eye_ratio*100)}% of frames), indicating good visual engagement."
        
        # Gesture insights
        gesture_freq = gesture_data.get('frequency', 0)
        if gesture_score > 60:
            gesture_insights = f"Gesture usage was minimal ({gesture_freq} gestures detected), suggesting possible delays in non-verbal communication."
        elif gesture_score > 30:
            gesture_insights = f"Gesture usage was emerging ({gesture_freq} gestures), which is within the range but could be further developed."
        else:
            gesture_insights = f"Gesture usage was good ({gesture_freq} gestures), showing appropriate non-verbal communication skills."
        
        # Smile insights
        smile_ratio = smile_data.get('ratio', 0)
        smile_freq = smile_data.get('frequency', 0)
        if smile_score > 60:
            smile_insights = f"Social smiling was limited ({int(smile_ratio*100)}% of frames, {smile_freq} distinct smiles), which may indicate reduced social responsiveness."
        elif smile_score > 30:
            smile_insights = f"Social smiling was moderate ({int(smile_ratio*100)}% of frames, {smile_freq} distinct smiles), showing some social responsiveness."
        else:
            smile_insights = f"Social smiling was frequent ({int(smile_ratio*100)}% of frames, {smile_freq} distinct smiles), indicating good emotional engagement."
        
        # Repetitive behavior insights
        repetitive_ratio = repetitive_data.get('ratio', 0)
        oscillations = repetitive_data.get('oscillationCount', 0)
        if repetitive_score > 60:
            repetitive_insights = f"Significant repetitive behaviors were observed ({oscillations} oscillatory movements), which is characteristic of autism spectrum patterns."
        elif repetitive_score > 30:
            repetitive_insights = f"Some repetitive behaviors were noted ({oscillations} oscillatory movements), which may be within typical range but worth monitoring."
        else:
            repetitive_insights = f"Minimal repetitive behaviors were observed ({oscillations} movements), which is age-appropriate."
        
        # Questionnaire insights
        if questionnaire_score > 60:
            questionnaire_insights = "Parent observations indicated multiple developmental concerns across social, communication, and behavioral domains."
        elif questionnaire_score > 30:
            questionnaire_insights = "Parent observations noted some areas of concern that align with screening results."
        else:
            questionnaire_insights = "Parent observations were largely within typical developmental range."
        
        # Recommendations
        recommendations = self._generate_recommendations(risk, likelihood)
        
        return {
            'summary': summary,
            'eyeContactInsights': eye_insights,
            'gestureInsights': gesture_insights,
            'smileInsights': smile_insights,
            'repetitiveInsights': repetitive_insights,
            'questionnaireInsights': questionnaire_insights,
            'recommendations': recommendations
        }
    
    def _generate_recommendations(self, risk: str, likelihood: float) -> list:
        """Generate recommendations based on risk level"""
        recommendations = []
        
        if risk == 'High':
            recommendations = [
                "Schedule a comprehensive diagnostic evaluation with a developmental pediatrician or child psychologist.",
                "Request a referral to an autism specialist for formal assessment (ADOS-2, ADI-R).",
                "Contact early intervention services in your area for immediate support.",
                "Keep detailed records of concerning behaviors to share with professionals.",
                "Join parent support groups to connect with other families navigating similar concerns.",
                "Consider speech-language and occupational therapy evaluations.",
                "Research evidence-based early intervention programs (ABA, DIR/Floortime, ESDM)."
            ]
        elif risk == 'Moderate':
            recommendations = [
                "Consult with your pediatrician about these screening results at your next visit.",
                "Request a developmental screening to assess multiple areas of development.",
                "Monitor social communication skills over the next 3-6 months.",
                "Consider a speech-language evaluation to assess communication development.",
                "Engage in structured play activities that encourage eye contact and gestures.",
                "Repeat this screening in 3-6 months to track any changes.",
                "Keep a journal of developmental milestones and behaviors."
            ]
        else:
            recommendations = [
                "Continue to support your child's development through play and interaction.",
                "Maintain regular pediatric check-ups to monitor developmental progress.",
                "Encourage social play with peers to build communication skills.",
                "Read books together and engage in activities that promote joint attention.",
                "If any new concerns arise, don't hesitate to consult with professionals.",
                "Consider periodic developmental screenings as part of routine care."
            ]
        
        # Always include disclaimer
        recommendations.append(
            "⚠️ IMPORTANT: This is a screening tool, NOT a diagnosis. Only qualified healthcare professionals can diagnose autism."
        )
        
        return recommendations
