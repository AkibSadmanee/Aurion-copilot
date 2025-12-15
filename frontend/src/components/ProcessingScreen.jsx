const ProcessingScreen = ({ isSuccess }) => {
  const [step, setStep] = useState(0);
  const steps = [
    "Uploading Audio...", 
    "Analyzing Medical Cues...", 
    "Transcribing Conversation...", 
    "Finalizing Analysis. This may take a couple of minutes..."
  ];

  useEffect(() => {
    // Only run the text cycle if NOT successful yet
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
          <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_50px_#22c55e60] mb-6 animate-bounce-short">
            <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-white">COMPLETE</h2>
          <p className="text-green-400 font-mono text-sm mt-2">Redirecting to Dashboard...</p>
        </div>
      ) : (
        /* --- LOADING STATE --- */
        <>
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-t-[#e087ff] border-r-transparent border-b-[#e087ff] border-l-transparent animate-spin shadow-[0_0_30px_#e087ff40]"></div>
            <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-t-transparent border-r-[#35d7f3] border-b-transparent border-l-[#35d7f3] animate-spin-reverse opacity-60"></div>
          </div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-white mb-2 animate-pulse">PROCESSING</h2>
          <p key={step} className="text-[#e087ff] font-mono text-lg animate-fade-in-up">{steps[step]}</p>
        </>
      )}
    </div>
  );
};