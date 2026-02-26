import os
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd


class QuestionnairePredictor:
    """Predict autism likelihood from questionnaire responses using trained models."""

    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_paths = [
            os.path.join(base_dir, "autism_model1.pkl"),
            os.path.join(base_dir, "autism_model2.pkl")
        ]
        self.models = [joblib.load(path) for path in self.model_paths if os.path.exists(path)]

        if not self.models:
            raise ValueError("No questionnaire models found (autism_model1.pkl / autism_model2.pkl)")

    def _encode_inputs(self, data: Dict) -> pd.DataFrame:
        responses = data.get("responses", [])
        
        # M-CHAT-R encoding with reverse-coded questions
        # Questions 2, 5, 12 are reverse-coded (YES=concern, NO=typical)
        # Standard questions: YES=typical (0), NO=concern (1)
        reverse_coded = [2, 5, 12]  # 1-indexed question numbers
        
        encoded_responses = []
        for i, answer in enumerate(responses):
            question_num = i + 1  # Convert to 1-indexed
            is_yes = bool(answer)
            
            if question_num in reverse_coded:
                # Reverse-coded: YES=1 (concern), NO=0 (typical)
                encoded_responses.append(1 if is_yes else 0)
            else:
                # Standard: YES=0 (typical), NO=1 (concern)
                encoded_responses.append(0 if is_yes else 1)
        
        responses = encoded_responses

        if len(responses) >= 20:
            q1 = responses[:10]
            q2 = responses[10:20]
            a_values = []
            for a, b in zip(q1, q2):
                avg = (a + b) / 2
                a_values.append(1 if avg >= 0.5 else 0)
        elif len(responses) >= 10:
            a_values = responses[:10]
        else:
            a_values = responses + [0] * (10 - len(responses))

        age = float(data.get("age", 36))
        sex = str(data.get("sex", "male")).lower()
        jaundice = str(data.get("jaundice", "no")).lower()
        family_asd = str(data.get("family_asd", "no")).lower()

        sex_val = 1 if sex in ["m", "male"] else 0
        jaundice_val = 1 if jaundice == "yes" else 0
        family_val = 1 if family_asd == "yes" else 0

        columns = [
            "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10",
            "Age", "Sex", "Jauundice", "Family_ASD"
        ]

        return pd.DataFrame(
            [a_values + [age, sex_val, jaundice_val, family_val]],
            columns=columns
        )

    def _predict_proba(self, model, features: pd.DataFrame) -> float:
        if hasattr(model, "predict_proba"):
            return float(model.predict_proba(features)[0][1])
        prediction = model.predict(features)[0]
        return float(prediction)

    def predict(self, data: Dict) -> Dict:
        features = self._encode_inputs(data)
        probabilities = [self._predict_proba(model, features) for model in self.models]
        probability = float(np.mean(probabilities))
        
        # Convert to percentage (0-100)
        percentage = probability * 100

        # Risk level thresholds: < 40% = Low, 40-70% = Moderate, >= 70% = High
        if percentage < 40:
            risk_level = "Low"
            interpretation = "Questionnaire suggests low autism risk"
            recommendations = [
                "Continue routine developmental monitoring",
                "Share results with your pediatrician at the next visit"
            ]
        elif percentage < 70:
            risk_level = "Moderate"
            interpretation = "Questionnaire suggests moderate autism risk"
            recommendations = [
                "Discuss results with your pediatrician",
                "Consider follow-up developmental screening"
            ]
        else:
            risk_level = "High"
            interpretation = "Questionnaire suggests elevated autism risk"
            recommendations = [
                "Schedule evaluation with a developmental specialist",
                "Seek early intervention guidance"
            ]

        confidence = round(max(probability, 1 - probability) * 100, 1)

        return {
            "probability": round(percentage, 1),
            "risk_level": risk_level,
            "interpretation": interpretation,
            "recommendations": recommendations,
            "confidence": confidence
        }
