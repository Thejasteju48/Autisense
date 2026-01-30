"""
Video Behavior Predictor
Analyzes 7 behavioral features from live video to assess autism likelihood.
Uses Groq LLM for dynamic clinical interpretations.

Features analyzed:
1. Eye Contact Ratio
2. Blink Rate per Minute
3. Head Movement Rate
4. Head Repetitive Movement
5. Hand Repetitive Movement
6. Gesture Frequency per Minute
7. Facial Expression Variability
"""

import numpy as np
import os
from typing import Dict
from groq import Groq


class VideoBehaviorPredictor:
    """
    Predicts autism likelihood based on 7 video behavioral features.
    Uses research-based thresholds, weighted scoring, and LLM-generated interpretations.
    """
    
    def __init__(self):
        # Initialize Groq client for AI-powered interpretations
        api_key = os.getenv('GROQ_API_KEY')
        self.groq_client = Groq(api_key=api_key) if api_key else None
        self.groq_model = "llama-3.3-70b-versatile"
        
        # Feature weights based on clinical significance
        self.weights = {
            'eye_contact': 0.25,           # Most significant indicator
            'expression_variability': 0.20, # Facial expressions important
            'gesture_frequency': 0.18,      # Communication gestures
            'head_repetition': 0.15,        # Repetitive behaviors
            'hand_repetition': 0.12,        # Repetitive behaviors
            'blink_rate': 0.05,             # Minor indicator
            'head_movement': 0.05           # Minor indicator
        }
        
        # Clinical thresholds (research-based)
        self.thresholds = {
            'eye_contact_low': 0.30,        # Below 30% is concerning
            'eye_contact_moderate': 0.50,   # 30-50% is borderline
            'blink_rate_low': 10,           # < 10 bpm unusual
            'blink_rate_high': 30,          # > 30 bpm unusual
            'gesture_low': 2,               # < 2 gestures/min concerning
            'expression_low': 0.25,         # < 0.25 variability concerning
            'head_oscillation_threshold': 3, # > 3 oscillations concerning
            'hand_oscillation_threshold': 5  # > 5 oscillations concerning
        }
    
    def calculate_eye_contact_score(self, ratio: float) -> float:
        """
        Score eye contact (0-100, higher = more concerning).
        Lower ratio = higher score (less eye contact is concerning).
        """
        if ratio < self.thresholds['eye_contact_low']:
            return 90.0  # Severe concern
        elif ratio < self.thresholds['eye_contact_moderate']:
            return 60.0  # Moderate concern
        else:
            return 20.0  # Low concern
    
    def calculate_blink_rate_score(self, blink_rate: float) -> float:
        """
        Score blink rate abnormalities.
        Both very low and very high rates can indicate issues.
        """
        if blink_rate < self.thresholds['blink_rate_low']:
            return 50.0  # Unusually low
        elif blink_rate > self.thresholds['blink_rate_high']:
            return 40.0  # Unusually high
        else:
            return 10.0  # Normal range
    
    def calculate_head_movement_score(self, movement_rate: float) -> float:
        """
        Score head movement rate.
        Excessive movement can indicate restlessness or sensory seeking.
        """
        if movement_rate > 0.5:
            return 60.0  # High movement
        elif movement_rate > 0.3:
            return 30.0  # Moderate movement
        else:
            return 10.0  # Normal
    
    def calculate_head_repetition_score(self, head_movements: Dict) -> float:
        """
        Score head movements and repetition.
        Checks if repetitive head movements are present.
        """
        if not isinstance(head_movements, dict):
            return 0.0
        
        repetitive = head_movements.get('repetitive', False)
        present = head_movements.get('present', False)
        
        if repetitive:
            return 80.0  # Repetitive head movements detected
        elif present:
            return 20.0  # Normal head movements
        else:
            return 0.0  # Minimal movement
    
    def calculate_hand_repetition_score(self, hand_stimming: Dict) -> float:
        """
        Score hand stimming behaviors.
        Checks severity of repetitive hand movements.
        """
        if not isinstance(hand_stimming, dict):
            return 0.0
        
        present = hand_stimming.get('present', False)
        severity = hand_stimming.get('severity', 'NORMAL')
        
        if not present or severity == 'NORMAL':
            return 0.0
        elif severity == 'LOW':
            return 30.0  # Subtle stimming
        elif severity == 'MODERATE':
            return 60.0  # Noticeable stimming
        else:  # HIGH
            return 90.0  # Prominent stimming
    
    def calculate_gesture_score(self, gesture_frequency: float) -> float:
        """
        Score gesture frequency.
        Lower frequency = higher score (limited gestures concerning).
        """
        if gesture_frequency < self.thresholds['gesture_low']:
            return 80.0  # Very few gestures
        elif gesture_frequency < 4:
            return 50.0  # Below average
        else:
            return 15.0  # Normal
    
    def calculate_expression_score(self, variability: float) -> float:
        """
        Score facial expression variability.
        Lower variability = higher score (limited expressions concerning).
        """
        if variability < self.thresholds['expression_low']:
            return 85.0  # Very limited expressions
        elif variability < 0.40:
            return 55.0  # Below average
        else:
            return 15.0  # Normal variability
    
    def predict(self, video_features: Dict) -> Dict:
        """
        Generate autism likelihood prediction from video features.
        
        Args:
            video_features: Dictionary with all 7 behavioral features
            
        Returns:
            Dictionary with prediction, risk level, and interpretation
        """
        # Extract features with defaults
        eye_contact_ratio = video_features.get('eye_contact_ratio', 0.5)
        blink_rate = video_features.get('blink_rate_per_minute', 15)
        head_movement = video_features.get('head_movement_rate', 0.2)
        head_movements = video_features.get('head_movements', {})
        hand_stimming = video_features.get('hand_stimming', {})
        social_gestures = video_features.get('social_gestures', {})
        expression_var = video_features.get('facial_expression_variability', 0.4)
        
        # Calculate individual scores
        eye_score = self.calculate_eye_contact_score(eye_contact_ratio)
        blink_score = self.calculate_blink_rate_score(blink_rate)
        head_move_score = self.calculate_head_movement_score(head_movement)
        head_rep_score = self.calculate_head_repetition_score(head_movements)
        hand_rep_score = self.calculate_hand_repetition_score(hand_stimming)
        gesture_score = self.calculate_gesture_score(social_gestures.get('frequency_per_minute', 0))
        expression_score = self.calculate_expression_score(expression_var)
        
        # Weighted fusion
        video_score = (
            eye_score * self.weights['eye_contact'] +
            expression_score * self.weights['expression_variability'] +
            gesture_score * self.weights['gesture_frequency'] +
            head_rep_score * self.weights['head_repetition'] +
            hand_rep_score * self.weights['hand_repetition'] +
            blink_score * self.weights['blink_rate'] +
            head_move_score * self.weights['head_movement']
        )
        
        # Determine risk level
        risk_level = self._determine_risk_level(video_score)
        
        # Generate LLM-powered interpretation
        interpretation = self._generate_llm_interpretation(
            video_score, risk_level, eye_contact_ratio, blink_rate, head_movement,
            head_movements, hand_stimming, social_gestures, expression_var
        )
        
        return {
            'video_behavior_score': round(video_score, 2),
            'risk_level': risk_level,
            'interpretation': interpretation,
            'component_scores': {
                'eye_contact': round(eye_score, 2),
                'blink_rate': round(blink_score, 2),
                'head_movement': round(head_move_score, 2),
                'head_repetition': round(head_rep_score, 2),
                'hand_repetition': round(hand_rep_score, 2),
                'gesture_frequency': round(gesture_score, 2),
                'facial_expression': round(expression_score, 2)
            }
        }
    
    def _determine_risk_level(self, score: float) -> str:
        """Determine risk level from video behavior score"""
        if score < 30:
            return 'Low'
        elif score < 55:
            return 'Moderate'
        else:
            return 'High'
    
    def _generate_llm_interpretation(self, score: float, risk_level: str,
                                     eye_contact: float, blink_rate: float, 
                                     head_movement: float, head_rep: Dict, 
                                     hand_rep: Dict, social_gestures: Dict,
                                     expression_var: float) -> str:
        """Generate AI-powered clinical interpretation using Groq LLM"""
        
        if not self.groq_client:
            # Fallback to basic interpretation if no API key
            return self._generate_basic_interpretation(
                score, eye_contact, blink_rate, head_movement, head_rep, 
                hand_rep, social_gestures.get('frequency_per_minute', 0), expression_var
            )
        
        try:
            # Extract values before f-string to avoid format errors
            head_detected = head_rep.get('repetitive', False) if isinstance(head_rep, dict) else False
            hand_detected = hand_rep.get('present', False) if isinstance(hand_rep, dict) else False
            gesture_freq = social_gestures.get('frequency_per_minute', 0) if isinstance(social_gestures, dict) else 0
            
            # Prepare detailed behavioral data for LLM
            prompt = f"""As a clinical psychologist specializing in autism assessment, provide a professional interpretation of these video behavioral observations:

**Video Behavior Score: {score:.1f}/100 (Risk Level: {risk_level})**

**Behavioral Measurements:**
- Eye Contact Ratio: {eye_contact*100:.1f}% (Normal: >50%)
- Gesture Frequency: {gesture_freq:.1f} per minute (Normal: >3/min)
- Facial Expression Variability: {expression_var:.2f} (Normal: >0.40)
- Blink Rate: {blink_rate:.1f} per minute (Normal: 15-20/min)
- Head Movement Rate: {head_movement:.4f}
- Head Repetitive Movement: {"Detected" if head_detected else "Not detected"}
- Hand Repetitive Movement: {"Detected" if hand_detected else "Not detected"}

Provide a concise, evidence-based interpretation (3-4 sentences) that:
1. Summarizes the most significant findings
2. Explains what these behaviors indicate
3. Provides specific recommendations for parents
4. Maintains a supportive, hopeful tone

Focus on actionable insights, not just descriptions."""

            completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert pediatric psychologist specializing in autism spectrum disorder assessment. Provide clear, compassionate, evidence-based interpretations."
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
            # Fallback to basic interpretation
            return self._generate_basic_interpretation(
                score, eye_contact, blink_rate, head_movement, head_rep, 
                hand_rep, gesture_freq, expression_var
            )
    
    def _generate_basic_interpretation(self, score: float, eye_contact: float, 
                                      blink_rate: float, head_movement: float,
                                      head_rep: Dict, hand_rep: Dict, 
                                      gesture_freq: float, expression_var: float) -> str:
        """Generate basic interpretation (fallback when LLM unavailable)"""
        concerns = []
        
        # Eye contact assessment
        if eye_contact < self.thresholds['eye_contact_low']:
            concerns.append(f"Severely reduced eye contact ({eye_contact*100:.1f}%)")
        elif eye_contact < self.thresholds['eye_contact_moderate']:
            concerns.append(f"Below-average eye contact ({eye_contact*100:.1f}%)")
        
        # Gesture assessment
        if gesture_freq < self.thresholds['gesture_low']:
            concerns.append(f"Limited communicative gestures ({gesture_freq:.1f}/min)")
        
        # Expression assessment
        if expression_var < self.thresholds['expression_low']:
            concerns.append(f"Restricted facial expressions (variability: {expression_var:.2f})")
        
        # Repetitive behavior assessment
        if isinstance(head_rep, dict) and head_rep.get('detected'):
            concerns.append(f"Repetitive head movements ({head_rep.get('oscillations', 0)} oscillations)")
        
        if isinstance(hand_rep, dict):
            left_det = hand_rep.get('leftHand', {}).get('detected', False)
            right_det = hand_rep.get('rightHand', {}).get('detected', False)
            if left_det or right_det:
                concerns.append("Repetitive hand movements detected")
        
        # Build interpretation summary
        if score < 30:
            summary = "Video analysis shows typical developmental patterns. "
        elif score < 55:
            summary = "Video analysis indicates some areas of concern. "
        else:
            summary = "Video analysis shows multiple behavioral markers consistent with autism. "
        
        if concerns:
            summary += "Specific observations: " + "; ".join(concerns) + ". "
        
        summary += "Professional evaluation recommended for comprehensive assessment."
        
        return summary
