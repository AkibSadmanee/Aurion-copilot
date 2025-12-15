import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EncounterForm from './EncounterForm';

// --- HELPER: Convert "02:30 PM" to "14:30" for Input Fields ---
const convertTo24Hour = (timeStr) => {
    if (!timeStr || timeStr === "Unknown" || timeStr === "?") return "";
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
        hours = '00';
    }
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}`;
};

// --- COMPONENT: Sparkline Graph ---
const SparklineGraph = ({ data, color = "#35d7f3" }) => {
    if (!data || data.length === 0) return <div className="h-24 flex items-center justify-center text-xs text-gray-600 font-mono">NO SIGNAL</div>;

    const height = 80;
    const width = 200;
    const maxVal = 100; 
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (val / maxVal) * height; 
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="w-full h-24 relative overflow-hidden group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible preserve-3d">
                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M 0,${height} ${points} L ${width},${height} Z`} fill="url(#gradient)" className="opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(53,215,243,0.6)]" />
            </svg>
            <div className="absolute inset-0 border-t border-b border-white/5 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-dashed border-white/5 h-1/4 w-full"></div>
                <div className="border-b border-dashed border-white/5 h-1/4 w-full"></div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isFormLoading, setIsFormLoading] = useState(false); 
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [formData, setFormData] = useState(null); 

  const data = location.state?.conversationData;

  const rawMeta = data?.metadata || {};
  const metadata = {
      start_time: rawMeta.start_time || "Unknown",
      end_time: rawMeta.end_time || "?",
      date: rawMeta.date || new Date().toISOString().split('T')[0],
      patient_name: (rawMeta.patient_name && rawMeta.patient_name !== "Unknown") ? rawMeta.patient_name : "Unidentified Patient",
      chw_name: (rawMeta.chw_name && rawMeta.chw_name !== "Unknown") ? rawMeta.chw_name : "Staff Member",
      session_id: rawMeta.session_id || `SESS-${Date.now()}`
  };

  const stats = data?.stats || { open_ended_questions: 0, closed_ended_questions: 0 };
  const audioStats = data?.audio_stats || { volume_series: [], stress_score: 2.5, max_volume: 0, min_volume: 0 };
  const summaryText = data?.summary || "No summary available.";

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data]);

  const handleGenerateReport = async () => {
    if (isGenerating) return; 
    setIsGenerating(true);
    try {
        const response = await fetch("http://localhost:8000/generate-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationData: data }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Aurion_Report_${metadata.session_id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } else {
            alert("Error generating report.");
        }
    } catch (error) {
        console.error(error);
        alert("Network error.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- UPDATED: HANDLE FILL FORM ---
  const handleFillForm = async () => {
    if (isFormLoading) return;
    setIsFormLoading(true);
    
    const transcriptText = data?.conversation
        ? data.conversation.map(t => `${t.speaker}: ${t.text}`).join("\n")
        : "";

    try {
        const response = await fetch("http://localhost:8000/extract-form-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: transcriptText })
        });

        if (response.ok) {
            const result = await response.json();
            const llmData = result.data;

            // --- MERGE METADATA HERE ---
            // We override the LLM's guesses with our hard facts (Time/Date/Name)
            const prefilledData = {
                ...llmData,
                patientName: metadata.patient_name,
                dateOfVisit: metadata.date,
                startTime: convertTo24Hour(metadata.start_time),
                endTime: convertTo24Hour(metadata.end_time),
            };

            setFormData(prefilledData);
            setIsFormOpen(true);
        } else {
            alert("Error extracting form data.");
        }
    } catch (e) {
        console.error(e);
        alert("Network error extracting form data.");
    } finally {
        setIsFormLoading(false);
    }
  };

  if (!data) return (
    <div className="bg-black text-white h-screen flex flex-col items-center justify-center font-mono">
        <p className="mb-4">NO SESSION DATA DETECTED</p>
        <button onClick={() => navigate('/')} className="text-[#35d7f3] underline">Return to Recorder</button>
    </div>
  );

  const totalQuestions = (stats.open_ended_questions || 0) + (stats.closed_ended_questions || 0);
  const openPercentage = totalQuestions > 0 ? (stats.open_ended_questions / totalQuestions) * 100 : 0;
  
  const isHighStress = audioStats.stress_score > 6;
  const stressColor = isHighStress ? "text-red-400" : "text-green-400";
  const stressBg = isHighStress ? "bg-red-500" : "bg-green-500";

  return (
    <div className="min-h-screen w-full bg-black text-gray-200 font-sans selection:bg-[#e087ff] selection:text-white relative overflow-y-auto">
      <div className="fixed inset-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/40 via-black to-black pointer-events-none z-0" />

      {/* FORM MODAL */}
      <EncounterForm 
         isOpen={isFormOpen} 
         onClose={() => setIsFormOpen(false)} 
         initialData={formData}
         sessionFilename={metadata.session_id} 
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 pb-24 flex flex-col gap-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-800 pb-6 animate-fade-in-up gap-4">
          <div className="flex flex-col gap-3">
            <div>
                <h1 className="text-5xl font-light tracking-[0.3em] text-gray-500">A U R I O N</h1>
                <p className="text-[#35d7f3] font-mono text-xs tracking-widest mt-2">MEDICAL INTELLIGENCE DASHBOARD</p>
            </div>
            
            <div className="flex gap-8 mt-2 text-xs font-mono text-gray-400 bg-gray-900/50 p-3 rounded border border-gray-800">
                <div className="flex flex-col gap-1">
                    <span className="text-gray-600 uppercase tracking-widest text-[10px]">Patient Name</span>
                    <span className="text-white text-sm font-bold">{metadata.patient_name}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-gray-600 uppercase tracking-widest text-[10px]">CHW Name</span>
                    <span className="text-gray-300 text-sm">{metadata.chw_name}</span>
                </div>
                <div className="w-px bg-gray-700 h-full mx-2"></div>
                <div className="flex flex-col gap-1">
                    <span className="text-gray-600 uppercase tracking-widest text-[10px]">Session Time (HST)</span>
                    <span className="text-[#35d7f3] text-sm">
                        {metadata.start_time} — {metadata.end_time}
                    </span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
                onClick={handleGenerateReport} disabled={isGenerating}
                className={`group flex items-center gap-2 px-5 py-2 border transition-all duration-300 rounded text-xs font-mono uppercase tracking-wider
                ${isGenerating 
                    ? 'bg-[#35d7f3]/20 border-[#35d7f3] cursor-wait text-white' 
                    : 'bg-[#35d7f3]/5 border-[#35d7f3]/30 hover:bg-[#35d7f3]/10 hover:border-[#35d7f3] text-[#35d7f3]'}`}
            >
                {isGenerating ? (
                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Generating...</>
                ) : "Generate Report"}
            </button>

            <button 
                onClick={handleFillForm} disabled={isFormLoading}
                className={`group flex items-center gap-2 px-5 py-2 border transition-all duration-300 rounded text-xs font-mono uppercase tracking-wider
                ${isFormLoading 
                    ? 'bg-[#e087ff]/20 border-[#e087ff] cursor-wait text-white' 
                    : 'bg-[#e087ff]/5 border-[#e087ff]/30 hover:bg-[#e087ff]/10 hover:border-[#e087ff] text-[#e087ff]'}`}
            >
                {isFormLoading ? (
                    <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing...</>
                ) : "Fill Form"}
            </button>

            <div className="h-6 w-px bg-gray-800 mx-2"></div>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-xs font-mono uppercase tracking-wider">New Session</button>
          </div>
        </div>

        {/* SUMMARY & ANALYTICS (Same as before) */}
        <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-lg relative overflow-hidden animate-fade-in-up">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#e087ff] to-transparent opacity-80" />
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-[#e087ff]">///</span> Clinical Assessment Summary
            </h2>
            <p className="text-gray-300 leading-relaxed font-light text-sm md:text-base border-l-2 border-gray-700 pl-4">
                {summaryText}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up delay-100">
            {/* Question Strategy */}
            <div className="md:col-span-1 bg-gray-900/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">CHW Strategy</h3>
                <div className="flex flex-col items-center gap-4 mt-4">
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gray-800" style={{ background: `conic-gradient(#35d7f3 ${openPercentage}%, #222 ${openPercentage}% 100%)` }}>
                         <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center"><span className="text-xl font-bold text-white">{Math.round(openPercentage)}%</span></div>
                    </div>
                    <div className="w-full flex justify-between text-xs px-1 font-mono"><span className="text-[#35d7f3]">Open ({stats.open_ended_questions})</span><span className="text-gray-500">Closed ({stats.closed_ended_questions})</span></div>
                </div>
            </div>

            {/* Volume Graph */}
            <div className="md:col-span-2 bg-gray-900/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2"><h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Voice Energy</h3><span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded font-mono">Peak: {audioStats.max_volume} dB</span></div>
                <SparklineGraph data={audioStats.volume_series} />
            </div>

            {/* Biometric Stress */}
            <div className="bg-gray-900/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${stressBg}`} />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Biometric Stress</h3>
                <div className="flex items-end gap-2 mt-4"><span className={`text-5xl font-light tracking-tighter ${stressColor}`}>{audioStats.stress_score || 0}</span><span className="text-sm text-gray-500 mb-2 font-mono">/ 10</span></div>
            </div>
        </div>

        {/* TRANSCRIPT */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl relative animate-fade-in-up delay-200">
            <div className="bg-black/40 border-b border-white/5 p-4 flex justify-between items-center shrink-0">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Dialogue Transcript</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">AI Diarization & Tagging Active</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
                {data.conversation && data.conversation.length > 0 ? (
                    data.conversation.map((turn, index) => {
                        const speakerName = turn.speaker ? turn.speaker.toUpperCase() : "UNKNOWN";
                        const isCHW = speakerName.includes("CHW") || speakerName.includes("WORKER");
                        const hasCues = turn.cues && turn.cues.length > 0;
                        const isLie = turn.is_hesitation; 
                        const isMaskedDistress = turn.is_masked_distress;

                        return (
                            <div key={index} className={`flex w-full ${isCHW ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] flex flex-col ${isCHW ? 'items-start' : 'items-end'}`}>
                                    <div className="flex gap-2 mb-1.5 items-center flex-wrap justify-end">
                                        <span className={`text-[10px] font-bold tracking-widest uppercase ${isCHW ? 'text-gray-500 pl-1' : 'text-[#35d7f3] pr-1'}`}>{isCHW ? "Community Health Worker" : "Patient"}</span>
                                        {hasCues && turn.cues.map((c, i) => <span key={i} className="px-1.5 py-0.5 rounded-[2px] bg-[#e087ff]/10 border border-[#e087ff]/40 text-[#e087ff] text-[8px] uppercase font-bold">{c}</span>)}
                                        {isLie && <span className="px-1.5 py-0.5 rounded-[2px] bg-orange-500/10 border border-orange-500/40 text-orange-400 text-[8px] uppercase font-bold">Hesitation</span>}
                                        {isMaskedDistress && <span className="px-1.5 py-0.5 rounded-[2px] bg-purple-500/10 border border-purple-500/40 text-purple-300 text-[8px] uppercase font-bold animate-pulse">⚠ Masked Distress</span>}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md border ${isCHW ? 'bg-gray-800/60 border-gray-700 text-gray-300 rounded-tl-none' : `rounded-tr-none ${isMaskedDistress ? 'bg-purple-900/20 border-purple-500/50 shadow-[0_0_15px_#a855f730]' : isLie ? 'bg-orange-900/10 border-orange-500/40' : hasCues ? 'bg-[#e087ff]/10 border-[#e087ff]/50' : 'bg-[#35d7f3]/10 border-[#35d7f3]/30 text-cyan-100'}`}`}>{turn.text}</div>
                                </div>
                            </div>
                        );
                    })
                ) : <div className="flex h-full items-center justify-center text-gray-600 font-mono text-sm">Waiting for Data...</div>}
            </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }`}</style>
    </div>
  );
};

export default Dashboard;