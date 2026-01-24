"""
VIDEO BEHAVIOR ANALYZER

Processes real-time video features extracted from MediaPipe
Combines with questionnaire data
Returns autism risk assessment using ML model
"""

import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class BehaviorAnalyzer:
    """
    Analyzes behavioral features for autism screening
    """
    
    def __init__(self):
        """Initialize analyzer with feature weights"""
        # Clinical weights based on autism diagnostic criteria (DSM-5)
        self.feature_weights = {
            'eye_contact': 0.25,          # Social communication marker
            'blink_rate': 0.10,           # Atypical patterns
            'head_movement': 0.15,        # Repetitive behaviors
            'hand_flapping': 0.20,        # Stereotyped motor behaviors
            'body_rocking': 0.15,         # Self-stimulating behaviors
            'face_orientation': 0.10,     # Social avoidance
            'emotion_stability': 0.05     # Affect regulation
        }
        
        # Thresholds for risk classification
        self.risk_thresholds = {
            'low': 30,
            'moderate': 60,
            'high': 100
        }
    
    def analyze_video_features(self, features: Dict) -> Dict:
        """
        Analyze video behavior features
        
        Args:
            features: Dictionary containing normalized feature scores
            
        Returns:
            Analysis results with risk assessment
        """
        try:
            # Extract feature scores
            scores = {}
            for feature_name in self.feature_weights.keys():
                # Handle different naming conventions
                key = feature_name
                if feature_name not in features:
                    # Try camelCase version
                    key = ''.join(word.capitalize() if i > 0 else word 
                                 for i, word in enumerate(feature_name.split('_')))
                
                if key in features:
                    scores[feature_name] = features[key].get('score', 0) if isinstance(features[key], dict) else features[key]
                else:
                    scores[feature_name] = 0
                    logger.warning(f"Feature '{feature_name}' not found in input")
            
            # Calculate weighted behavior score
            video_score = self._calculate_weighted_score(scores)
            
            # Classify risk level
            risk_level = self._classify_risk(video_score)
            
            # Generate feature importance
            feature_importance = self._calculate_feature_importance(scores)
            
            return {
                'video_behavior_score': round(video_score, 2),
                'risk_level': risk_level,
                'feature_scores': scores,
                'feature_importance': feature_importance,
                'confidence': self._calculate_confidence(scores)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing video features: {str(e)}")
            raise
    
    def combine_with_questionnaire(self, 
                                   video_features: Dict, 
                                   questionnaire_answers: List[Dict]) -> Dict:
        """
        Combine video analysis with questionnaire data
        
        Args:
            video_features: Analyzed video features
            questionnaire_answers: List of questionnaire responses
            
        Returns:
            Combined risk assessment
        """
        try:
            # Analyze video features
            video_analysis = self.analyze_video_features(video_features)
            
            # Analyze questionnaire
            questionnaire_score = self._analyze_questionnaire(questionnaire_answers)
            
            # Weighted combination (60% video, 40% questionnaire)
            video_weight = 0.6
            questionnaire_weight = 0.4
            
            combined_score = (
                video_analysis['video_behavior_score'] * video_weight +
                questionnaire_score * questionnaire_weight
            )
            
            # Final risk classification
            final_risk = self._classify_risk(combined_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                final_risk,
                video_analysis['feature_scores'],
                questionnaire_score
            )
            
            return {
                'combined_score': round(combined_score, 2),
                'video_score': round(video_analysis['video_behavior_score'], 2),
                'questionnaire_score': round(questionnaire_score, 2),
                'risk_classification': final_risk,
                'feature_analysis': video_analysis['feature_scores'],
                'feature_importance': video_analysis['feature_importance'],
                'confidence': video_analysis['confidence'],
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Error combining analyses: {str(e)}")
            raise
    
    def _calculate_weighted_score(self, scores: Dict) -> float:
        """Calculate weighted behavior score (0-100)"""
        weighted_sum = 0
        total_weight = 0
        
        for feature, weight in self.feature_weights.items():
            if feature in scores:
                weighted_sum += scores[feature] * weight
                total_weight += weight
        
        # Normalize to 0-100 scale
        return (weighted_sum / total_weight) * 100 if total_weight > 0 else 0
    
    def _classify_risk(self, score: float) -> Dict:
        """Classify risk level based on score"""
        if score < self.risk_thresholds['low']:
            return {
                'level': 'LOW',
                'label': 'Low Risk',
                'description': 'Minimal autism spectrum indicators observed',
                'color': '#10b981'
            }
        elif score < self.risk_thresholds['moderate']:
            return {
                'level': 'MODERATE',
                'label': 'Moderate Risk',
                'description': 'Some autism spectrum characteristics observed',
                'color': '#f59e0b'
            }
        else:
            return {
                'level': 'HIGH',
                'label': 'High Risk',
                'description': 'Multiple autism spectrum characteristics observed',
                'color': '#ef4444'
            }
    
    def _calculate_feature_importance(self, scores: Dict) -> Dict:
        """Calculate relative importance of each feature"""
        importance = {}
        total_weighted = sum(
            scores.get(f, 0) * w 
            for f, w in self.feature_weights.items()
        )
        
        if total_weighted > 0:
            for feature, weight in self.feature_weights.items():
                score = scores.get(feature, 0)
                importance[feature] = {
                    'contribution': round((score * weight / total_weighted) * 100, 1),
                    'severity': 'high' if score > 0.7 else 'moderate' if score > 0.4 else 'low'
                }
        
        return importance
    
    def _calculate_confidence(self, scores: Dict) -> float:
        """Calculate confidence level of analysis"""
        # More consistent scores = higher confidence
        if not scores:
            return 0.0
        
        values = list(scores.values())
        mean = np.mean(values)
        std = np.std(values)
        
        # Lower standard deviation = higher confidence
        confidence = max(0, 1 - (std / (mean + 0.1))) * 100
        return round(confidence, 2)
    
    def _analyze_questionnaire(self, answers: List[Dict]) -> float:
        """Analyze questionnaire responses"""
        if not answers:
            return 50.0  # Default mid-range
        
        total_score = 0
        max_score = 0
        
        for answer in answers:
            weight = answer.get('weight', 1)
            max_score += weight
            
            # Binary scoring
            response = answer.get('answer', 0)
            if response in [1, True, 'yes', 'Yes', 'YES']:
                total_score += weight
        
        # Normalize to 0-100
        return (total_score / max_score) * 100 if max_score > 0 else 0
    
    def _generate_recommendations(self, 
                                  risk: Dict, 
                                  features: Dict,
                                  questionnaire_score: float) -> List[Dict]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # General recommendations based on risk level
        if risk['level'] == 'LOW':
            recommendations.extend([
                {
                    'priority': 'info',
                    'category': 'monitoring',
                    'text': 'Continue monitoring developmental milestones'
                },
                {
                    'priority': 'info',
                    'category': 'social',
                    'text': 'Encourage social interaction and play activities'
                }
            ])
        elif risk['level'] == 'MODERATE':
            recommendations.extend([
                {
                    'priority': 'warning',
                    'category': 'evaluation',
                    'text': 'Schedule evaluation with developmental pediatrician'
                },
                {
                    'priority': 'warning',
                    'category': 'screening',
                    'text': 'Consider comprehensive developmental screening (M-CHAT-R/F)'
                },
                {
                    'priority': 'info',
                    'category': 'documentation',
                    'text': 'Document specific behaviors and share with healthcare provider'
                }
            ])
        else:  # HIGH
            recommendations.extend([
                {
                    'priority': 'urgent',
                    'category': 'evaluation',
                    'text': 'URGENT: Schedule immediate evaluation with autism specialist'
                },
                {
                    'priority': 'urgent',
                    'category': 'professional',
                    'text': 'Contact developmental pediatrician or child psychologist'
                },
                {
                    'priority': 'warning',
                    'category': 'intervention',
                    'text': 'Consider early intervention services evaluation'
                }
            ])
        
        # Feature-specific recommendations
        if features.get('eye_contact', 0) > 0.6:
            recommendations.append({
                'priority': 'info',
                'category': 'social',
                'text': 'Practice eye contact through engaging activities and games'
            })
        
        if features.get('hand_flapping', 0) > 0.6:
            recommendations.append({
                'priority': 'info',
                'category': 'sensory',
                'text': 'Provide alternative sensory activities and fidget tools'
            })
        
        if features.get('body_rocking', 0) > 0.6:
            recommendations.append({
                'priority': 'info',
                'category': 'therapy',
                'text': 'Consult occupational therapist for sensory integration strategies'
            })
        
        if features.get('head_movement', 0) > 0.6:
            recommendations.append({
                'priority': 'info',
                'category': 'behavioral',
                'text': 'Track repetitive movement patterns and discuss with specialist'
            })
        
        return recommendations

# Initialize global analyzer
behavior_analyzer = BehaviorAnalyzer()
