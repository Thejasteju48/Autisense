from typing import Dict


def assess_social_reciprocity(eye_contact_label: str, gesture_present: bool, head_stable: bool) -> Dict:
    if eye_contact_label == "Normal Eye Contact" and gesture_present and head_stable:
        return {"label": "Normal"}
    return {"label": "Low"}
