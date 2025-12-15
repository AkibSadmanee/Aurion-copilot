import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- COMPONENT: Processing Screen (Overlay) ---
const ProcessingScreen = ({ isSuccess }) => {
  const [step, setStep] = useState(0);
  
  // Simulated steps to keep the user engaged while backend works
  const steps = [
   "Uploading Audio...", 
    "Analyzing Medical Cues...", 
    "Transcribing Conversation...", 
    "Finalizing Analysis. This may take a couple of minutes..."
  ];

  useEffect(() => {
    // Stop cycling text if we have already succeeded
    if (isSuccess) return;

    const timers = [
      setTimeout(() => setStep(1), 3000),
      setTimeout(() => setStep(2), 10000),
      setTimeout(() => setStep(3), 18000),
      setTimeout(() => setStep(4), 50000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-500">
      
      {/* --- SUCCESS STATE --- */}
      {isSuccess ? (
        <div className="flex flex-col items-center animate-fade-in-up">
          {/* Green Checkmark Animation */}
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_50px_#22c55e60] mb-6 animate-bounce">
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-white">SESSION COMPLETE</h2>
          <p className="text-green-400 font-mono text-sm mt-4 animate-pulse">Redirecting to Dashboard...</p>
        </div>
      ) : (
        /* --- LOADING STATE --- */
        <>
          <div className="relative mb-8">
            {/* Spinning Orb */}
            <div className="w-24 h-24 rounded-full border-4 border-t-[#e087ff] border-r-transparent border-b-[#e087ff] border-l-transparent animate-spin shadow-[0_0_30px_#e087ff40]"></div>
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-transparent border-r-[#35d7f3] border-b-transparent border-l-[#35d7f3] animate-spin-slow opacity-60"></div>
          </div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-white mb-2 animate-pulse">PROCESSING</h2>
          
          {/* Progress Steps Text */}
          <div className="h-8 flex items-center justify-center">
             <p key={step} className="text-[#e087ff] font-mono text-lg animate-fade-in-up">{steps[step]}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="w-64 h-1 bg-gray-800 rounded mt-6 overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-[#e087ff] to-[#35d7f3] transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min((step + 1) * 20, 100)}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};

// --- MAIN COMPONENT: VoiceRecorderUI ---
const VoiceRecorderUI = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [cues, setCues] = useState([]); 

  // --- REFS ---
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamMediaRecorderRef = useRef(null); // Slices audio for WS
  const globalMediaRecorderRef = useRef(null); // Records full session
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const isRecordingRef = useRef(false);

  // Visualizer Waves Configuration
  const wavesRef = useRef([
    { color: '#e087ff', radiusOffset: 0,  sensitivity: 2.6, width: 3, currentPhase: 0,    targetPhase: Math.random() * 2000, speed: 2.2 }, 
    { color: '#ce4aff', radiusOffset: 10, sensitivity: 2.2, width: 3, currentPhase: 500,  targetPhase: Math.random() * 2000, speed: 1.8 }, 
    { color: '#35d7f3ff', radiusOffset: 20, sensitivity: 1.8, width: 2, currentPhase: 1000, targetPhase: Math.random() * 2000, speed: 1.4 },  
    { color: '#7a1fa2', radiusOffset: 30, sensitivity: 1.4, width: 2, currentPhase: 1500, targetPhase: Math.random() * 2000, speed: 1.0 }
  ]);

  // Sync refs and manage status text
  useEffect(() => {
    isRecordingRef.current = isRecording;
    if (!isRecording && !isProcessing && !isSuccess) setStatus("Ready");
  }, [isRecording, isProcessing, isSuccess]);

  // Start Visualizer on Mount
  useEffect(() => {
    drawVisualizer();
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      fullCleanup();
    };
  }, []); 

  // --- CLEANUP ---
  const fullCleanup = () => {
    if (streamMediaRecorderRef.current && streamMediaRecorderRef.current.state !== 'inactive') {
      streamMediaRecorderRef.current.stop();
    }
    if (globalMediaRecorderRef.current && globalMediaRecorderRef.current.state !== 'inactive') {
        globalMediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setCues([]); 
      await startRecording();
    }
  };

  // --- START RECORDING ---
  const startRecording = async () => {
    try {
      // 1. WebSocket Setup (Real-time Cues)
      socketRef.current = new WebSocket("ws://localhost:8000/ws/audio");
      
      await new Promise((resolve, reject) => {
        socketRef.current.onopen = () => {
          setStatus("Listening...");
          resolve();
        };
        socketRef.current.onerror = (error) => {
          setStatus("Connection Error");
          reject(error);
        };
      });

      // Handle Incoming Cues
      socketRef.current.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === "health_analysis") {
                const newCuesWithIds = message.payload.detected_cues.map(c => ({
                    ...c, id: Date.now() + Math.random() 
                }));
                setCues((prev) => [...newCuesWithIds, ...prev]);
                // Auto-remove alert after 5 seconds
                newCuesWithIds.forEach(cue => {
                    setTimeout(() => {
                        setCues(currentCues => currentCues.filter(c => c.id !== cue.id));
                    }, 5000); 
                });
            }
        } catch (err) {
            console.error("JSON Error:", err);
        }
      };

      // 2. Get Audio Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // 3. Setup Visualizer Audio Context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 1024;
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      // 4. Start Loops
      setIsRecording(true);
      isRecordingRef.current = true;
      
      startStreamingLoop(stream);       // For Real-time AI
      startFullSessionRecorder(stream); // For Post-session Report

    } catch (err) {
      console.error("Error starting audio:", err);
      setStatus("Microphone Error");
      fullCleanup();
    }
  };

  // --- LOOP A: STREAMING (Chunks -> WebSocket) ---
  const startStreamingLoop = (stream) => {
    if (!isRecordingRef.current) return;

    let options = { mimeType: 'audio/webm;codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'audio/mp4' };

    const recorder = new MediaRecorder(stream, options);
    streamMediaRecorderRef.current = recorder;

    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(blob);
        } 
        if (isRecordingRef.current) startStreamingLoop(stream);
    };

    recorder.start();
    // Slice every 3 seconds
    setTimeout(() => { 
        if (recorder.state === "recording") recorder.stop(); 
    }, 3000);
  };

  // --- LOOP B: GLOBAL RECORDER (Start to End -> HTTP Upload) ---
  const startFullSessionRecorder = (stream) => {
    let options = { mimeType: 'audio/webm;codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'audio/mp4' };

    const globalRecorder = new MediaRecorder(stream, options);
    const globalChunks = [];

    globalRecorder.ondataavailable = (e) => { if (e.data.size > 0) globalChunks.push(e.data); };
    
    // When this stops, we trigger the upload
    globalRecorder.onstop = async () => {
        const fullBlob = new Blob(globalChunks, { type: options.mimeType });
        await uploadFullAudio(fullBlob);
    };

    globalRecorder.start();
    globalMediaRecorderRef.current = globalRecorder;
  };

  // --- UPLOAD & REDIRECT LOGIC ---
  const uploadFullAudio = async (blob) => {
    setIsProcessing(true); // Show Loading Screen
    setIsSuccess(false);
    
    const formData = new FormData();
    const filename = `session_${Date.now()}.webm`; 
    formData.append("file", blob, filename);

    try {
        const response = await fetch("http://localhost:8000/upload-full-audio", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            
            // 1. Show Green Tick
            setIsSuccess(true); 

            // 2. Wait 1 second, then Redirect
            setTimeout(() => {
                navigate('/dashboard', { state: { conversationData: result.data } });
            }, 1000);
            
        } else {
            console.error("❌ Upload failed");
            setStatus("Upload Error");
            setIsProcessing(false);
        }
    } catch (error) {
        console.error("❌ Network error:", error);
        setStatus("Network Error");
        setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    
    // Stop Global Recorder -> Triggers onstop -> Triggers uploadFullAudio
    if (globalMediaRecorderRef.current && globalMediaRecorderRef.current.state === "recording") {
        globalMediaRecorderRef.current.stop();
    }

    // Cleanup tracks/sockets slightly later to allow final events to fire
    setTimeout(() => {
         if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
         if (socketRef.current) socketRef.current.close();
    }, 500); 
  };

  // --- VISUALIZER DRAWING LOGIC ---
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      
      wavesRef.current.forEach(wave => {
          if (wave.currentPhase < wave.targetPhase) wave.currentPhase += wave.speed;
          else wave.currentPhase -= wave.speed;
          if (Math.abs(wave.currentPhase - wave.targetPhase) < wave.speed * 2) {
              wave.targetPhase = Math.random() * 2000; 
          }
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 150; 
      const maxWaveHeight = 120;

      let dataArray;
      let bufferLength = 0;
      const active = isRecordingRef.current;

      if (active && analyserRef.current) {
          bufferLength = analyserRef.current.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
      } else {
          bufferLength = 512; 
          dataArray = new Uint8Array(bufferLength).fill(0);
      }

      wavesRef.current.forEach(wave => {
          ctx.beginPath();
          const totalSteps = 180; 
          for (let i = 0; i <= totalSteps; i++) {
            const angle = (i / totalSteps) * Math.PI * 2;
            let v = 0;
            if (active && bufferLength > 0) {
                const normalizedStep = i / totalSteps;
                let indexMap = Math.abs(normalizedStep - 0.5) * 2; 
                let dataIndex = Math.floor(indexMap * (bufferLength * 0.7));
                const phaseInt = Math.floor(wave.currentPhase);
                dataIndex = (dataIndex + phaseInt) % bufferLength;
                v = dataArray[dataIndex] / 255.0;
                v = v * v * wave.sensitivity; 
            }
            const currentRadius = baseRadius + wave.radiusOffset + (v * maxWaveHeight);
            const x = centerX + Math.cos(angle) * currentRadius;
            const y = centerY + Math.sin(angle) * currentRadius;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.lineWidth = wave.width;
          ctx.strokeStyle = wave.color;
          ctx.lineCap = 'round';
          if (active) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = wave.color;
            ctx.globalCompositeOperation = 'screen'; 
          } else {
             ctx.shadowBlur = 5;
             ctx.shadowColor = wave.color;
             ctx.globalCompositeOperation = 'source-over';
          }
          ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';
    };
    renderFrame();
  };

  const getSeverityStyles = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-900/60 border-red-500 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
      case 'severe':   return 'bg-orange-900/60 border-orange-500 text-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.4)]';
      case 'moderate': return 'bg-yellow-900/60 border-yellow-500 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.4)]';
      case 'mild':     return 'bg-teal-900/60 border-teal-500 text-teal-100 shadow-[0_0_15px_rgba(20,184,166,0.4)]';
      default:         return 'bg-gray-800 border-gray-600 text-gray-300';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-hidden font-sans relative">
      
      {/* --- OVERLAY: Processing Screen --- */}
      {isProcessing && <ProcessingScreen isSuccess={isSuccess} />}

      <div className="absolute top-20 text-center z-20 pointer-events-none">
        <h1 className="text-5xl font-light tracking-[0.3em] text-gray-500">A U R I O N</h1>
        <p className={`text-md mt-3 font-mono uppercase tracking-widest transition-all duration-500 ${isRecording ? 'text-[#e087ff] animate-pulse' : 'text-gray-700'}`}>
            {status}
        </p>
      </div>

      {/* --- VISUALIZER & BUTTON --- */}
      <div className="relative w-[700px] h-[700px] flex items-center justify-center">
        <canvas ref={canvasRef} width={700} height={700} className="z-10 pointer-events-none"/>
        <button 
            onClick={handleToggleRecording}
            className={`absolute z-30 flex items-center justify-center transition-all duration-300 ease-in-out ${isRecording ? 'w-24 h-24 bg-red-500/10 border-red-500 hover:bg-red-500/20' : 'w-20 h-20 bg-gray-900 border-gray-700 hover:border-[#e087ff]'} rounded-full border-2 backdrop-blur-sm cursor-pointer group`}
        >
            {isRecording ? (
                <div className="w-8 h-8 bg-red-500 rounded-sm" />
            ) : (
                <div className="w-0 h-0 border-l-[18px] border-l-[#e087ff] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"/>
            )}
        </button>
      </div>
      
      {/* --- REAL-TIME CUES LIST --- */}
      <div className="absolute bottom-5 w-full max-w-lg flex flex-col gap-3 px-6 z-40 h-640 overflow-y-auto pointer-events-none">
        {cues.map((cue) => (
          <div key={cue.id} className={`flex flex-col border-l-4 p-4 rounded-r backdrop-blur-md transition-all animate-fade-in-up ${getSeverityStyles(cue.severity)}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs uppercase tracking-wider opacity-90">{cue.category}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-white/20">{cue.severity}</span>
            </div>
            <p className="text-md font-medium text-white/90 shadow-black drop-shadow-md">{cue.issue_summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceRecorderUI;