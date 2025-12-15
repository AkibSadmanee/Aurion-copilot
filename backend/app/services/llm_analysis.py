import json

SYSTEM_PROMPT_FULL = """
You are an advanced Medical Scribe. You will receive a raw transcript of a conversation between a Community Health Worker (CHW) and a Patient, along with biometric audio data.

**YOUR TASKS:**

1. **METADATA EXTRACTION:**
   - Look for introductions (e.g., "Hi, I'm Sarah", "Good morning Mr. Jones").
   - Extract the **CHW Name** and **Patient Name**.
   - If a name is not spoken, return "Unknown".

2. **DIARIZATION (Speaker Identification):**
   - Split the text into "CHW" and "Patient" turns.
   - You MUST include EVERY turn.

3. **CHW PERFORMANCE ANALYSIS:**
   - Count **Open-Ended** vs **Closed-Ended** questions asked by the CHW.

4. **PATIENT CUE TAGGING:**
   - Tag issues: "Economic Stability", "Education", "Health Care", "Environment", "Social Context".
   - **Mismatch:** If Audio Energy < 40 but text is positive, flag `is_masked_distress: true`.
   - **Hesitation:** If text has stutters, flag `is_hesitation: true`.

5. **CLINICAL SUMMARY:**
   - Provide a 3-4 sentence clinical assessment summary.

**OUTPUT SCHEMA (Strict JSON):**
{
  "extracted_names": {
    "chw_name": "Name or Unknown",
    "patient_name": "Name or Unknown"
  },
  "summary": "Clinical summary...",
  "stats": {
    "open_ended_questions": 0,
    "closed_ended_questions": 0
  },
  "conversation": [
    {
      "speaker": "CHW",
      "text": "Hello, I am Sarah.",
      "cues": [], 
      "is_masked_distress": false,
      "is_hesitation": false
    }
  ]
}
"""

def analyze_transcript(client, raw_text, audio_stats):
    energy_score = audio_stats.get('energy_score', 50)
    
    context_string = f"""
    BIOMETRIC CONTEXT:
    - Patient Audio Energy Score: {energy_score}/100 
    (Note: < 40 indicates lethargy. > 70 indicates anxiety).
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o", 
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_FULL},
                {"role": "user", "content": f"{context_string}\n\nRAW TRANSCRIPT:\n{raw_text}"}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "extracted_names": {"chw_name": "Unknown", "patient_name": "Unknown"},
            "summary": "Error analyzing conversation.",
            "stats": {"open_ended_questions": 0, "closed_ended_questions": 0},
            "conversation": []
        }
    

SYSTEM_PROMPT_FORM = """
You are a Medical Data Assistant. Your goal is to extract structured data from a CHW-Patient conversation to pre-fill an Encounter Form.

**AVAILABLE OPTIONS (Exact String Matching Required):**
- Topics: "General check in", "Chronic conditions (diabetes, hypertension, asthma, etc.)", "Medication use and adherence", "Nutrition", "Physical activity", "Substance use", "Mental health", "Preventive care (screenings, vaccines)", "Housing instability", "Food insecurity", "Transportation needs", "Employment or financial needs", "Safety concerns", "Insurance or benefits navigation", "Scheduling appointments", "Understanding care plans", "Follow up on missed appointments", "Support after hospital/ER discharge", "Advocacy", "Emotional support", "Crisis support".
- Referrals: "Primary care", "Specialty care", "Behavioral health", "Emergency services", "Housing services", "Food pantry or SNAP", "Transportation program", "Social services / case management", "Community education classes", "Legal or immigration support".
- Risks: "Mental health crisis", "Suicidal ideation", "Domestic violence", "Substance misuse", "Child or elder safety concern", "Medical emergency symptoms", "Severe food insecurity", "Homelessness", "Unmet medication needs".

**OUTPUT SCHEMA (JSON):**
{
  "patientName": "Extracted Name",
  "topics": ["Array of strings matching options above"],
  "referrals": ["Array of strings matching options above"],
  "risks": ["Array of strings matching options above"],
  "stageOfChange": ["Patient is not thinking about making changes.", "Patient is thinking about making changes.", "Patient plans to make changes soon.", "Patient is already making changes.", "Patient has been maintaining changes.", "Patient tried but slipped back to old habits."],
  "patientGoals": "Summary of goals mentioned",
  "confidence": "1" to "5" (String),
  "chwNotes": "Summary of the interaction",
  "followUpPlan": "Action items mentioned"
}
"""

def extract_form_data(client, raw_text):
    try:
        response = client.chat.completions.create(
            model="gpt-4o", # 4o is better for complex extraction
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_FORM},
                {"role": "user", "content": f"TRANSCRIPT:\n{raw_text}"}
            ]
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Form Extraction Error: {e}")
        return {}