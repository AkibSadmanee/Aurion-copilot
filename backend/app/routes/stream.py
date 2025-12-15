import os
import io
import json
from fastapi import (APIRouter, 
                     WebSocket, 
                     WebSocketDisconnect, 
                     UploadFile, File, Request,
                     HTTPException)
from openai import OpenAI
from dotenv import load_dotenv

from fastapi.responses import FileResponse
from app.services.rag_service import get_solution_from_context
from app.services.pdf_service import generate_pdf_report
from pydantic import BaseModel
from typing import Dict, Any

import sys
sys.path.append("..")

from datetime import datetime, timedelta, timezone
from app.services.llm_analysis import analyze_transcript, extract_form_data
from app.services.audio_analysis import analyze_audio_signal
from app.services.rag_service import get_solution_from_context
from app.services.pdf_service import generate_pdf_report

# Force load .env file
load_dotenv()

router = APIRouter()

# Initialize OpenAI Client
try:
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        print(f"OpenAI Key found: {api_key[:8]}...")
        client = OpenAI() 
    else:
        print("ERROR: OPENAI_API_KEY not found.")
        client = None
except Exception as e:
    client = None
    print(f"OpenAI Client Init Error: {e}")


def get_session_time_data(filename, duration_seconds):
    try:
        timestamp_ms = int(filename.split('_')[1].split('.')[0])
        start_utc = datetime.fromtimestamp(timestamp_ms / 1000.0, tz=timezone.utc)
        end_utc = start_utc + timedelta(seconds=duration_seconds)
        
        # HST Offset (UTC-10)
        hst_offset = timezone(timedelta(hours=-10))
        start_hst = start_utc.astimezone(hst_offset)
        end_hst = end_utc.astimezone(hst_offset)
        
        return {
            "date": start_hst.strftime("%Y-%m-%d"),
            "start_time": start_hst.strftime("%I:%M %p"),
            "end_time": end_hst.strftime("%I:%M %p"),
            "session_id": f"SESS-{str(timestamp_ms)[-6:]}"
        }
    except Exception:
        return {"date": "N/A", "start_time": "N/A", "end_time": "N/A", "session_id": "Unknown"}

@router.post("/upload-full-audio")
async def upload_full_audio(file: UploadFile = File(...)):
    print(f"💾 Receiving full audio file: {file.filename}")
    
    # 1. SAVE FILE TO DISK
    file_location = f"recorded_sessions/{file.filename}"
    os.makedirs(os.path.dirname(file_location), exist_ok=True)
    
    try:
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
    except Exception as e:
        print(f"❌ File Save Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save audio file.")

    # 2. PROCESS AUDIO (Signal Processing)
    # Extracts Volume, Pitch, Stress Score, Energy Score, and Duration
    print("🔊 Analyzing Audio Signals...")
    audio_stats = analyze_audio_signal(file_location)

    # 3. GENERATE TIME METADATA
    # Uses filename + duration from audio_stats
    duration = audio_stats.get("duration_seconds", 0)
    time_meta = get_session_time_data(file.filename, duration)

    # 4. TRANSCRIBE
    if not client:
        return {"status": "error", "message": "OpenAI Client not initialized"}
    
    print("🎙️ Transcribing...")
    try:
        with open(file_location, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file, 
                language="en"
            )
        raw_text = transcription.text
    except Exception as e:
        print(f"❌ Transcription Error: {e}")
        raw_text = "(Transcription Failed)"

    # 5. LLM ANALYSIS (Diarization, Stats, Names, Cues)
    print("🧠 Analyzing Conversation...")
    # We pass audio_stats so the LLM can detect 'Masked Distress' (Low Energy + Positive Text)
    llm_result = analyze_transcript(client, raw_text, audio_stats)

    # 6. MERGE METADATA
    # Combine the Time data (from file) with the Names (from LLM)
    extracted_names = llm_result.get("extracted_names", {"chw_name": "Unknown", "patient_name": "Unknown"})
    
    complete_metadata = {
        **time_meta,          # date, start_time, end_time, session_id
        **extracted_names     # chw_name, patient_name
    }

    # 7. CONSTRUCT FINAL RESPONSE
    final_data = {
        "metadata": complete_metadata,
        "audio_stats": audio_stats, 
        "summary": llm_result.get("summary"),
        "stats": llm_result.get("stats"), 
        "conversation": llm_result.get("conversation")
    }

    print("✅ Processing Complete. Sending response.")
    return {"status": "success", "data": final_data}

@router.websocket("/ws/audio")
async def audio_stream(websocket: WebSocket):
    await websocket.accept()
    print("🔵 Client Connected.")

    # System prompt for real-time (Short & Fast)
    SYSTEM_PROMPT = """
You are a Health Triage Analyzer. Analyze the "Current Statement".
Ignore questions/greetings. Return "detected_cues": [].

Look for cues related to:
1. Economic Stability Issue
2. Education Access Issue
3. Health Care Access Issue
4. Neighborhood/Environment Issue
5. Social/Community Context Issue

Output strictly valid JSON:
{
  "detected_cues": [
    {
      "category": "Economic Stability" | "Education" | "Health Care" | "Environment" | "Social Context",
      "issue_summary": "3-5 word description",
      "severity": "Mild" | "Moderate" | "Severe" | "Critical"
    }
  ]
}
"""
    conversation_history = [] 

    try:
        while True:
            # Receive & Process
            try:
                audio_data = await websocket.receive_bytes()
            except WebSocketDisconnect:
                print("🔴 Client Disconnected (during receive)")
                break

            if len(audio_data) < 100: continue

            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.webm" 

            transcript_text = ""

            if client:
                try:
                    transcription = client.audio.transcriptions.create(
                        model="whisper-1", file=audio_file, language="en"
                    )
                    transcript_text = transcription.text
                except Exception:
                    continue

            if transcript_text.strip() and client:
                print(f"   🗣️ User said: '{transcript_text}'")
                
                # Simple Context Management for Real-time
                recent_history = conversation_history[-2:] 
                if recent_history:
                    context_block = "\n".join([f"- {msg}" for msg in recent_history])
                    final_user_content = f"Context:\n{context_block}\n\nCurrent Statement:\n{transcript_text}"
                else:
                    final_user_content = transcript_text

                try:
                    response = client.chat.completions.create(
                        model="gpt-4o-mini",
                        response_format={"type": "json_object"},
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": final_user_content}
                        ]
                    )
                    ai_raw_response = response.choices[0].message.content
                    analysis_data = json.loads(ai_raw_response)

                    conversation_history.append(transcript_text)
                    if len(conversation_history) > 10: conversation_history.pop(0)

                    cues = analysis_data.get("detected_cues", [])
                    if cues:
                        # WRAP SEND IN TRY/EXCEPT TO HANDLE DISCONNECTS
                        try:
                            await websocket.send_json({
                                "type": "health_analysis",
                                "payload": analysis_data
                            })
                        except (WebSocketDisconnect, RuntimeError):
                            print("⚠️ Client disconnected while sending data.")
                            break

                except Exception as e:
                    print(f"❌ LLM Logic Error: {e}")

    except WebSocketDisconnect:
        print("\n🔴 Client Disconnected")
    except Exception as e:
        # Ignore normal cleanup errors
        if "accept" not in str(e) and "connected" not in str(e):
             print(f"\n❌ Connection Error: {e}")


class ReportRequest(BaseModel):
    conversationData: dict


@router.post("/generate-report")
async def generate_report_endpoint(request: Request):
    body = await request.json()
    data = body.get("conversationData")
    
    if not data:
        return {"status": "error", "message": "No data provided"}

    print("📄 Generating Report...")
    
    # 1. Identify Problems to Solve
    conversation = data.get("conversation", [])
    solved_problems = []

    for turn in conversation:
        cues = turn.get("cues", [])
        text = turn.get("text", "")
        speaker = turn.get("speaker", "")
        is_distress = turn.get("is_masked_distress", False)
        
        # Logic: If Patient speaks AND (has cues OR is masked distress)
        if speaker == "Patient" and (len(cues) > 0 or is_distress):
            
            print(f"   🔍 RAG Search for: {text[:30]}...")
            
            # 2. Get Solution from RAG
            solution = get_solution_from_context(client, text)
            
            # Combine cue list
            display_cues = cues if cues else []
            if is_distress: display_cues.append("Masked Distress")

            solved_problems.append({
                "cues": display_cues,
                "text": text,
                "solution": solution
            })

    # 3. Generate PDF
    pdf_path = generate_pdf_report(data, solved_problems)
    
    print(f"✅ Report generated: {pdf_path}")

    # 4. Return File
    return FileResponse(
        path=pdf_path, 
        filename="Medical_Triage_Report.pdf", 
        media_type='application/pdf'
    )


class FormData(BaseModel):
    filename: str
    data: Dict[str, Any]

@router.post("/extract-form-data")
async def extract_form_data_endpoint(request: Request):
    body = await request.json()
    transcript = body.get("transcript", "")
    
    if not transcript:
        return {"status": "error", "message": "No transcript provided"}

    print("📝 Extracting Form Data...")
    form_data = extract_form_data(client, transcript)
    
    return {"status": "success", "data": form_data}

# 3. ENDPOINT: SAVE FORM (JSON)
@router.post("/save-form")
async def save_form_endpoint(payload: FormData):
    print(f"💾 Saving Form: {payload.filename}")
    
    save_dir = "./forms"
    os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, f"{payload.filename}.json")
    
    try:
        with open(file_path, "w", encoding='utf-8') as f:
            json.dump(payload.data, f, indent=2)
        print("✅ Form Saved.")
        return {"status": "success", "filepath": file_path}
    except Exception as e:
        print(f"❌ Save Error: {e}")
        return {"status": "error", "message": str(e)}