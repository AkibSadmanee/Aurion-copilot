from fpdf import FPDF
import datetime
import os

class MedicalReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.set_text_color(53, 215, 243) 
        self.cell(0, 10, 'AURION // MEDICAL TRIAGE REPORT', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(240, 240, 240) 
        self.set_text_color(0)
        self.cell(0, 10, f'  {title}', 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 10)
        self.set_text_color(50)
        self.multi_cell(0, 6, body)
        self.ln()

def generate_pdf_report(data, solved_problems):
    pdf = MedicalReport()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # --- 1. SESSION METADATA ---
    meta = data.get('metadata', {})
    
    def clean(text):
        return str(text).encode('latin-1', 'replace').decode('latin-1')

    pdf.set_font('Arial', '', 9)
    pdf.set_text_color(100)
    pdf.cell(0, 6, f"Report Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", 0, 1, 'R')
    pdf.ln(2)

    pdf.set_text_color(0)
    
    # Row A
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(25, 6, "Session Date:", 0, 0)
    pdf.set_font('Arial', '', 10)
    pdf.cell(65, 6, clean(meta.get('date', 'N/A')), 0, 0)
    
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(25, 6, "Time (HST):", 0, 0)
    pdf.set_font('Arial', '', 10)
    pdf.cell(0, 6, f"{clean(meta.get('start_time', '?'))} - {clean(meta.get('end_time', '?'))}", 0, 1)

    # Row B
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(25, 6, "Patient:", 0, 0)
    pdf.set_font('Arial', '', 10)
    pdf.cell(65, 6, clean(meta.get('patient_name', 'Unknown')), 0, 0)

    pdf.set_font('Arial', 'B', 10)
    pdf.cell(25, 6, "CHW Name:", 0, 0)
    pdf.set_font('Arial', '', 10)
    pdf.cell(0, 6, clean(meta.get('chw_name', 'Unknown')), 0, 1)

    pdf.ln(5)

    # --- 2. EXECUTIVE SUMMARY ---
    pdf.chapter_title("CLINICAL ASSESSMENT SUMMARY")
    summary_text = data.get('summary', 'No summary available.')
    pdf.chapter_body(clean(summary_text))
    pdf.ln(2)

    # # --- 3. BIOMETRIC ANALYSIS ---
    # pdf.chapter_title("BIOMETRIC ANALYSIS")
    # stats = data.get('audio_stats', {})
    # pdf.set_font('Courier', '', 10)
    
    # s_score = stats.get('stress_score', 0)
    # raw_energy = stats.get('energy_score', 0)
    # # Normalize Energy to 0-10 if needed
    # e_score = raw_energy / 10 if raw_energy > 10 else raw_energy

    # pdf.cell(0, 6, f"Stress Score: {round(s_score, 1)}/10  (>6 indicates high vocal tension)", 0, 1)
    # pdf.cell(0, 6, f"Energy Score: {round(e_score, 1)}/10  (<4 indicates lethargy/flat affect)", 0, 1)
    # pdf.ln(5)

    # --- 4. COMMUNICATION QUALITY ANALYSIS (New Section) ---
    pdf.chapter_title("COMMUNICATION QUALITY ANALYSIS")
    
    q_stats = data.get('stats', {})
    open_q = q_stats.get('open_ended_questions', 0)
    closed_q = q_stats.get('closed_ended_questions', 0)
    total_q = open_q + closed_q

    pdf.set_font('Arial', '', 10)
    
    if total_q == 0:
        pdf.cell(0, 6, "No questions detected from the CHW in this session.", 0, 1)
    else:
        # Calculate Ratio
        ratio = (open_q / total_q) * 100
        
        # Display Raw Counts
        pdf.cell(0, 6, f"Open-Ended Questions:   {open_q}", 0, 1)
        pdf.cell(0, 6, f"Closed-Ended Questions: {closed_q}", 0, 1)
        pdf.cell(0, 6, f"Open-Ended Ratio:       {ratio:.1f}%", 0, 1)
        pdf.ln(2)

        # Automated Feedback Logic
        if ratio >= 30:
            feedback = "EXCELLENT. High use of open-ended questions promotes patient narrative."
            pdf.set_text_color(0, 150, 0) # Green
        elif ratio >= 15:
            feedback = "GOOD. Balanced mix, but consider asking more open inquiries to uncover root causes."
            pdf.set_text_color(200, 150, 0) # Dark Orange
        else:
            feedback = "NEEDS IMPROVEMENT. High reliance on Yes/No questions limits information gathering."
            pdf.set_text_color(200, 0, 0) # Red
        
        pdf.set_font('Arial', 'B', 10)
        pdf.multi_cell(0, 6, f"Quality Assessment: {feedback}")
        pdf.set_text_color(0) # Reset color

    pdf.ln(5)

    # --- 5. DETECTED ISSUES & SOLUTIONS ---
    pdf.chapter_title("DETECTED ISSUES & GUIDED SOLUTIONS")
    
    if not solved_problems:
        pdf.chapter_body("No specific health cues requiring intervention were detected in this session.")
    else:
        for item in solved_problems:
            pdf.set_font('Arial', 'B', 10)
            pdf.set_text_color(168, 85, 247) 
            cues_str = ", ".join(item.get('cues', []))
            pdf.cell(0, 6, clean(f"ISSUE CATEGORY: {cues_str}"), 0, 1)
            
            pdf.set_font('Arial', 'I', 10)
            pdf.set_text_color(80) 
            pdf.multi_cell(0, 6, clean(f"Patient Statement: \"{item.get('text', '')}\""))
            
            pdf.set_font('Arial', '', 10)
            pdf.set_text_color(0) 
            pdf.multi_cell(0, 6, clean(f"Recommended Action: {item.get('solution', '')}"))
            pdf.ln(3)
            
            pdf.set_draw_color(220)
            pdf.line(10, pdf.get_y(), 200, pdf.get_y())
            pdf.ln(5)

    # --- 6. FULL TRANSCRIPT ---
    if pdf.get_y() > 220:
        pdf.add_page()
    else:
        pdf.ln(10)

    pdf.chapter_title("FULL TRANSCRIPT")
    
    conversation = data.get('conversation', [])
    
    if not conversation:
        pdf.chapter_body("No transcript data available.")
    else:
        for turn in conversation:
            speaker = clean(turn.get('speaker', 'Unknown'))
            text = clean(turn.get('text', ''))
            
            pdf.set_font('Arial', 'B', 9)
            pdf.set_text_color(0)
            pdf.write(5, f"{speaker}: ")
            
            pdf.set_font('Arial', '', 9)
            pdf.set_text_color(50)
            pdf.write(5, text)
            pdf.ln(6)

    filename = f"report_{int(datetime.datetime.now().timestamp())}.pdf"
    output_dir = "generated_reports"
    os.makedirs(output_dir, exist_ok=True)
    
    filepath = os.path.join(output_dir, filename)
    pdf.output(filepath)
    return filepath