import React, { useState, useEffect } from "react";

// --- CONSTANTS ---
const topicsDiscussed = [
  "General check in", "Chronic conditions (diabetes, hypertension, asthma, etc.)", "Medication use and adherence", "Nutrition", "Physical activity", "Substance use", "Mental health", "Preventive care (screenings, vaccines)", "Housing instability", "Food insecurity", "Transportation needs", "Employment or financial needs", "Safety concerns", "Insurance or benefits navigation", "Scheduling appointments", "Understanding care plans", "Follow up on missed appointments", "Support after hospital/ER discharge", "Advocacy", "Emotional support", "Crisis support",
];

const referrals = [
  "Primary care", "Specialty care", "Behavioral health", "Emergency services", "Housing services", "Food pantry or SNAP", "Transportation program", "Social services / case management", "Community education classes", "Legal or immigration support",
];

const stagesOfChange = [
  "Patient is not thinking about making changes.", "Patient is thinking about making changes.", "Patient plans to make changes soon.", "Patient is already making changes.", "Patient has been maintaining changes.", "Patient tried but slipped back to old habits.",
];

const riskFlags = [
  "Mental health crisis", "Suicidal ideation", "Domestic violence", "Substance misuse", "Child or elder safety concern", "Medical emergency symptoms", "Severe food insecurity", "Homelessness", "Unmet medication needs",
];

// --- MAIN COMPONENT ---
const EncounterForm = ({ isOpen, onClose, initialData, sessionFilename }) => {
  if (!isOpen) return null;

  // --- STATE ---
  const [showSuccess, setShowSuccess] = useState(false); // <--- NEW STATE FOR NOTIFICATION
  
  const [formData, setFormData] = useState({
    patientName: "",
    dateOfVisit: new Date().toISOString().split('T')[0],
    startTime: "", endTime: "",
    topics: [], topicsOther: "",
    referrals: [], referralsOther: "",
    stageOfChange: [], patientGoals: "", confidence: "",
    risks: [], risksOther: "", chwNotes: "", followUpPlan: "",
  });

  // --- LOAD DATA ---
  useEffect(() => {
    if (initialData) {
        setFormData(prev => ({
            ...prev,
            ...initialData,
            topics: initialData.topics || [],
            referrals: initialData.referrals || [],
            risks: initialData.risks || [],
            stageOfChange: initialData.stageOfChange || []
        }));
    }
  }, [initialData]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (groupName, option) => {
    setFormData((prev) => {
      const current = prev[groupName] || [];
      const exists = current.includes(option);
      return {
        ...prev,
        [groupName]: exists
          ? current.filter((item) => item !== option)
          : [...current, option],
      };
    });
  };

  const handleStageChange = (stage) => {
    setFormData((prev) => {
      const current = prev.stageOfChange || [];
      const exists = current.includes(stage);
      return {
        ...prev,
        stageOfChange: exists
          ? current.filter((s) => s !== stage)
          : [...current, stage],
      };
    });
  };

  const handleClear = () => {
    setFormData({
        patientName: "", dateOfVisit: "", startTime: "", endTime: "",
        topics: [], topicsOther: "", referrals: [], referralsOther: "",
        stageOfChange: [], patientGoals: "", confidence: "",
        risks: [], risksOther: "", chwNotes: "", followUpPlan: "",
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("http://localhost:8000/save-form", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: sessionFilename || `form_${Date.now()}`,
                data: formData
            })
        });
        
        if (response.ok) {
            // --- SHOW SUCCESS NOTIFICATION ---
            setShowSuccess(true);
            
            // Wait 1.5s then close modal
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 1500);
        } else {
            alert("❌ Failed to save form. Check console.");
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("Network error saving form.");
    }
  };

  const baseInputClasses = "w-full bg-black/40 border border-gray-800 focus:border-[#35d7f3] focus:ring-1 focus:ring-[#35d7f3] rounded-md px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600 transition-colors";

  return (
    // FIXED OVERLAY
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      
      {/* --- SUCCESS NOTIFICATION POPUP --- */}
      {showSuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce-short">
            <div className="flex items-center gap-3 px-6 py-3 bg-[#0a0a0a] border border-[#35d7f3] rounded-full shadow-[0_0_20px_rgba(53,215,243,0.4)]">
                <div className="w-5 h-5 rounded-full bg-[#35d7f3] flex items-center justify-center text-black">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span className="text-[#35d7f3] font-mono text-sm tracking-widest uppercase font-bold">
                    Form Saved Successfully
                </span>
            </div>
        </div>
      )}

      {/* MODAL CONTAINER */}
      <div className="relative w-full max-w-5xl bg-gray-900 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-fade-in-up">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur rounded-t-2xl z-10 sticky top-0">
          <div>
            <h2 className="text-2xl font-light tracking-[0.2em] text-[#35d7f3]">ENCOUNTER FORM</h2>
            <div className="flex items-center gap-2 mt-1">
                {initialData ? (
                    <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-800 uppercase tracking-wider">AI Auto-Filled</span>
                ) : (
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 uppercase tracking-wider">Manual Entry</span>
                )}
                <span className="text-xs text-gray-500 font-mono">ID: {sessionFilename || "NEW_SESSION"}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-white transition text-3xl font-light hover:rotate-90 duration-300"
          >
            &times;
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
            
            {/* 1. Details */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#e087ff]">///</span> Encounter Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1 block">Patient Name <span className="text-[#e087ff]">*</span></label>
                        <input name="patientName" type="text" className={baseInputClasses} value={formData.patientName} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1 block">Date of Visit</label>
                        <input name="dateOfVisit" type="date" className={baseInputClasses} value={formData.dateOfVisit} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1 block">Start Time</label>
                        <input name="startTime" type="time" className={baseInputClasses} value={formData.startTime} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-500 mb-1 block">End Time</label>
                        <input name="endTime" type="time" className={baseInputClasses} value={formData.endTime} onChange={handleChange} />
                    </div>
                </div>
            </section>

            {/* 2. Topics & Referrals */}
            <section className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#e087ff]">///</span> Topics & Referrals
                </h2>
                <div className="space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400">Topics Discussed</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {topicsDiscussed.map(t => (
                            <label key={t} className={`flex items-start gap-2 text-xs md:text-sm px-3 py-2 rounded-md border cursor-pointer transition-all ${formData.topics.includes(t) ? 'bg-[#e087ff]/10 border-[#e087ff]/50 text-white' : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                                <input type="checkbox" className="accent-[#e087ff] mt-0.5" checked={formData.topics.includes(t)} onChange={() => handleCheckboxChange("topics", t)} />
                                <span>{t}</span>
                            </label>
                        ))}
                    </div>
                    <input type="text" name="topicsOther" className={baseInputClasses + " mt-2"} placeholder="Other topics..." value={formData.topicsOther} onChange={handleChange} />
                </div>

                <div className="space-y-2 mt-4">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400">Referrals Provided</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {referrals.map(ref => (
                            <label key={ref} className={`flex items-start gap-2 text-xs md:text-sm px-3 py-2 rounded-md border cursor-pointer transition-all ${formData.referrals.includes(ref) ? 'bg-[#35d7f3]/10 border-[#35d7f3]/50 text-white' : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                                <input type="checkbox" className="accent-[#35d7f3] mt-0.5" checked={formData.referrals.includes(ref)} onChange={() => handleCheckboxChange("referrals", ref)} />
                                <span>{ref}</span>
                            </label>
                        ))}
                    </div>
                    <input type="text" name="referralsOther" className={baseInputClasses + " mt-2"} placeholder="Other referrals..." value={formData.referralsOther} onChange={handleChange} />
                </div>
            </section>

            {/* 3. Readiness */}
            <section className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#e087ff]">///</span> Readiness & Goals
                </h2>
                <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-2">Stage of Change</p>
                    <div className="grid grid-cols-1 gap-2">
                        {stagesOfChange.map(stage => (
                            <label key={stage} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-md border cursor-pointer transition-all ${formData.stageOfChange.includes(stage) ? 'bg-white/10 border-white/40 text-white' : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                                <input type="checkbox" className="accent-white mt-0.5" checked={formData.stageOfChange.includes(stage)} onChange={() => handleStageChange(stage)} />
                                <span>{stage}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-1 block">Patient Goals</label>
                    <textarea name="patientGoals" rows={3} className={baseInputClasses} placeholder="Describe patient goals..." value={formData.patientGoals} onChange={handleChange} />
                </div>
                <div>
                    <p className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-1">Confidence Level (1-5)</p>
                    <div className="flex gap-4">
                        {["1", "2", "3", "4", "5"].map(val => (
                            <label key={val} className="flex items-center gap-1 cursor-pointer">
                                <input type="radio" name="confidence" value={val} className="accent-[#35d7f3]" checked={formData.confidence === val} onChange={handleChange} />
                                <span className="text-sm text-gray-300 font-mono">{val}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Risks & Notes */}
            <section className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#35d7f3]">///</span> Risks & Assessment
                </h2>
                <div className="space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-red-400">Red Flags / Risks</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {riskFlags.map(risk => (
                            <label key={risk} className={`flex items-start gap-2 text-xs md:text-sm px-3 py-2 rounded-md border cursor-pointer transition-all ${formData.risks.includes(risk) ? 'bg-red-900/20 border-red-500/50 text-red-100' : 'bg-black/20 border-gray-800 text-gray-400 hover:border-gray-600'}`}>
                                <input type="checkbox" className="accent-red-500 mt-0.5" checked={formData.risks.includes(risk)} onChange={() => handleCheckboxChange("risks", risk)} />
                                <span>{risk}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-1 block">CHW Notes</label>
                        <textarea name="chwNotes" rows={5} className={baseInputClasses} placeholder="Detailed narrative..." value={formData.chwNotes} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="text-[11px] font-mono uppercase tracking-widest text-gray-400 mb-1 block">Follow-Up Plan</label>
                        <textarea name="followUpPlan" rows={5} className={baseInputClasses} placeholder="Next steps..." value={formData.followUpPlan} onChange={handleChange} />
                    </div>
                </div>
            </section>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 rounded-b-2xl flex flex-col md:flex-row justify-between items-center gap-4 z-10 sticky bottom-0">
             <div className="text-[10px] text-gray-600 font-mono uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Secure Environment. Do not enter passwords.
             </div>
             <div className="flex gap-3 w-full md:w-auto">
                <button type="button" onClick={handleClear} className="flex-1 md:flex-none px-4 py-2 rounded border border-gray-700 text-gray-400 text-xs font-mono uppercase hover:text-white hover:border-gray-500 transition">Clear</button>
                <button type="button" onClick={onClose} className="flex-1 md:flex-none px-4 py-2 rounded border border-gray-700 text-gray-400 text-xs font-mono uppercase hover:text-white hover:border-gray-500 transition">Cancel</button>
                <button type="button" onClick={handleSave} className="flex-1 md:flex-none px-6 py-2 rounded bg-[#35d7f3]/10 border border-[#35d7f3]/50 text-[#35d7f3] text-xs font-mono uppercase hover:bg-[#35d7f3]/20 hover:shadow-[0_0_15px_rgba(53,215,243,0.3)] transition font-bold">Save Record</button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default EncounterForm;