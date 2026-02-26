# M-CHAT-R Questionnaire Reference Guide

## Overview
The Autisense screening system uses the **M-CHAT-R (Modified Checklist for Autism in Toddlers - Revised)**, a validated, 20-item screening questionnaire for autism spectrum disorder in children aged 12-72 months.

---

## 20 Screening Questions

### **Standard Coding Questions** (YES = Typical, NO = Concern)
These questions assess presence of typical developmental behaviors. Answering **"NO"** indicates potential concern.

1. **If you point at something across the room, does your child look at it?**
   - Example: pointing at a toy or animal
   - Domain: Joint attention, gaze following

2. ~~Have you ever wondered if your child might be deaf?~~ ⚠️ **REVERSE-CODED**

3. **Does your child play pretend or make-believe?**
   - Example: pretend to drink from empty cup, talk on phone, feed doll
   - Domain: Symbolic play/imagination

4. **Does your child like climbing on things?**
   - Example: furniture, playground equipment, stairs
   - Domain: Motor skills, physical engagement

5. ~~Does your child make unusual finger movements near his or her eyes?~~ ⚠️ **REVERSE-CODED**

6. **Does your child point with one finger to ask for something or to get help?**
   - Example: pointing to snack or toy out of reach
   - Domain: Imperative pointing, communication

7. **Does your child point with one finger to show you something interesting?**
   - Example: pointing to airplane or truck
   - Domain: Declarative pointing, joint attention

8. **Is your child interested in other children?**
   - Example: watches other children, smiles at them, goes to them
   - Domain: Social interest, peer interaction

9. **Does your child show you things by bringing them to you or holding them up for you to see – not to get help, but just to share?**
   - Example: showing flower, stuffed animal, toy truck
   - Domain: Sharing, turn-taking, social reciprocity

10. **Does your child respond when you call his or her name?**
    - Example: looks up, talks/babbles, stops activity
    - Domain: Responsive attention, social orienting

11. **When you smile at your child, does he or she smile back at you?**
    - Domain: Social reciprocity, imitation, affect sharing

12. ~~Does your child get upset by everyday noises?~~ ⚠️ **REVERSE-CODED**

13. **Does your child walk?**
    - Domain: Motor development milestone

14. **Does your child look you in the eye when you are talking to him or her, playing with him or her, or dressing him or her?**
    - Domain: Eye contact, joint attention

15. **Does your child try to copy what you do?**
    - Example: wave bye-bye, clap, make funny noise
    - Domain: Imitative learning, motor imitation

16. **If you turn your head to look at something, does your child look around to see what you are looking at?**
    - Domain: Joint attention, gaze following

17. **Does your child try to get you to watch him or her?**
    - Example: looks at you for praise; says "look" or "watch me"
    - Domain: Social initiation, seeking attention

18. **Does your child understand when you tell him or her to do something?**
    - Example: "put the book on the chair" or "bring me the blanket"
    - Domain: Language comprehension, following instructions

19. **If something new happens, does your child look at your face to see how you feel about it?**
    - Example: strange/funny noise, new toy
    - Domain: Social referencing, joint attention

20. **Does your child like movement activities?**
    - Example: being swung or bounced on your knee
    - Domain: Sensory-motor engagement

---

## Reverse-Coded Questions

### **Questions 2, 5, 12** (YES = Concern, NO = Typical)
These questions assess atypical or concerning behaviors. Answering **"YES"** indicates potential concern.

**Q2: Have you ever wondered if your child might be deaf?**
- YES = Possible hearing or responsiveness concern
- Domain: Auditory responsiveness

**Q5: Does your child make unusual finger movements near his or her eyes?**
- YES = Stereotyped repetitive behaviors (hand flapping, finger wiggling)
- Domain: Repetitive movements (stimming)

**Q12: Does your child get upset by everyday noises?**
- YES = Sensory sensitivity/auditory defensiveness
- Domain: Sensory processing differences

---

## Scoring Logic

### **Encoding Process (ML Service)**
The ML service automatically encodes responses accounting for reverse coding:

**Standard Questions (1, 3, 4, 6-11, 13-20):**
- YES (parent reports typical behavior) → 0 (no concern)
- NO (parent reports absence of behavior) → 1 (concern)

**Reverse-Coded Questions (2, 5, 12):**
- YES (parent reports concerning behavior) → 1 (concern)
- NO (parent reports no concerning behavior) → 0 (no concern)

### **Risk Assessment**
- Responses encoded as 0-1 values feeding trained ML models
- Ensemble prediction (Random Forest + Gradient Boosting) outputs probability 0-100%
- Risk thresholds:
  - **Low Risk:** < 40%
  - **Moderate Risk:** 40-70%
  - **High Risk:** ≥ 70%

---

## Assessment Domains Covered

1. **Joint Attention** - Questions 1, 6, 7, 16, 19
2. **Play & Imagination** - Question 3
3. **Social Interest & Reciprocity** - Questions 8, 9, 11, 17
4. **Communication** - Question 18
5. **Imitation & Motor Skills** - Questions 4, 13, 15
6. **Eye Contact** - Question 14
7. **Name Response** - Question 10
8. **Atypical Behaviors** - Questions 2, 5, 12
9. **Sensory-Motor Engagement** - Question 20

---

## Important Notes

✅ **Evidence-Based:** M-CHAT-R is a validated screening tool recommended by pediatricians  
✅ **Clinical Quality:** 20 items assess core autism-related developmental areas  
✅ **Dual-Set Design:** Some items complement each other for consistency  
✅ **Parent-Completed:** Designed for caregiver observations of real behaviors  

⚠️ **Screening Only:** Not a diagnostic tool; positive results warrant professional evaluation  
⚠️ **Age-Appropriate:** Designed for children 12-72 months (2-6 years)

---

## Integration with Video Analysis

**Final Score = 60% Questionnaire + 40% Video Behavior Analysis**

- **Questionnaire (60%):** M-CHAT-R responses processed through ML ensemble model
- **Video (40%):** 6 behavioral markers (eye contact, stimming, hand gesture, social reciprocity, emotion variation) derived from video analysis
- **Combined Risk Assessment:** Comprehensive evaluation leveraging both assessment methods
