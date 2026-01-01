import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Activity, AlertTriangle, CheckCircle, Mic, Target } from 'lucide-react';
import Webcam from 'react-webcam';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Audio Context helper for SFX
const playSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'beep') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'start') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'analyzing') {
            osc.type = 'sawtooth';
            const freqs = [100, 200, 150];
            osc.frequency.setValueAtTime(freqs[Math.floor(Math.random() * 3)], now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'lie') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.5);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
        } else if (type === 'true') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.setValueAtTime(554, now + 0.2); // C#5
            osc.frequency.setValueAtTime(659, now + 0.4); // E5
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
        }
    } catch (e) {
        console.error(e);
    }
};

const CameraFeed = () => (
    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <Webcam
            audio={false}
            className="w-full h-full object-cover filter grayscale sepia hue-rotate-90 contrast-125 brightness-75 scale-x-[-1]"
        />
        {/* Face HUD Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <div className="w-64 h-64 border border-cyber-green/50 rounded-full relative animate-pulse">
                <Target className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-cyber-green/80" strokeWidth={1} />
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-cyber-green bg-black px-2">FACE_RECOGNITION</div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyber-green"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyber-green"></div>

                {/* Random Numbers */}
                <div className="absolute top-10 -right-12 text-[8px] flex flex-col gap-1 text-cyber-green/70 font-mono">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>ID_AX_{i}: {Math.floor(Math.random() * 999)}</div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const Header = () => (
    <header className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center text-xs md:text-sm tracking-widest border-b border-cyber-green/30 bg-cyber-black/80 backdrop-blur-sm z-30 select-none">
        <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="hidden md:inline">POLYGRAPH SYSTEM v9.0</span>
            <span className="md:hidden">P-SYS v9.0</span>
        </div>
        <div className="flex gap-4 opacity-70">
            <span className="hidden md:inline">CPU: 42%</span>
            <span className="text-cyber-green animate-pulse">ONLINE</span>
        </div>
    </header>
);

const Footer = () => (
    <footer className="absolute bottom-0 w-full p-4 text-[10px] text-center opacity-40 uppercase tracking-[0.2em] border-t border-cyber-green/20 select-none">
        Unauthorized use is a federal offense.
    </footer>
)

// Audio Analyzer Hook
const useAudioAnalyzer = (active) => {
    const [audioData, setAudioData] = useState(new Uint8Array(32).fill(0));
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!active) {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            return;
        }

        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                const analyser = ctx.createAnalyser();
                const source = ctx.createMediaStreamSource(stream);

                analyser.fftSize = 64; // Small size for performance and chunkiness
                source.connect(analyser);

                audioContextRef.current = ctx;
                analyserRef.current = analyser;
                sourceRef.current = source;

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const update = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    setAudioData(new Uint8Array(dataArray));
                    rafRef.current = requestAnimationFrame(update);
                };
                update();
            } catch (err) {
                console.warn("Microphone access denied or error", err);
                // Fallback to simpler random animation handled by UI
            }
        };

        initAudio();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [active]);

    return audioData;
};


export default function App() {
    const [status, setStatus] = useState('IDLE'); // IDLE, CALIBRATING, ANALYZING, RESULT_TRUE, RESULT_LIE
    const [scanText, setScanText] = useState('INITIALIZING...');
    const [baseline, setBaseline] = useState(null); // { volume: 0, pitch: 0 }

    // High res analyzer for data processing, distinct from visualizer if possible, 
    // but here we just reuse the hook's data or logic.
    // Actually, we need to access the raw data inside the logic. 
    // For simplicity, we will calculate "instant" metrics during the ANALYZING/CALIBRATING phase
    // using a ref to the AudioContext from the hook? No, the hook handles it.
    // Let's modify the hook to return the analyser node or processing functions.
    // OR, simpler: We calculate metrics inside the component using the `audioData` (frequency data).

    // Note: audioData from hook is currently FrequencyData (FFT).
    // Current FFT size is 64(visuals). We need higher for analysis.
    // Let's modify useAudioAnalyzer to accept "mode" ('visual' or 'analysis').
    // For now, we'll stick to Volume (RMS equivalent from FFT sum) as the main "Stress" indicator
    // because Pitch requires higher FFT size which might slow down the visualizer or complicate things.
    // "Volume Stress" (Loud/Fast talking) is a good enough proxy for a joke app.

    const audioData = useAudioAnalyzer(status === 'ANALYZING' || status === 'CALIBRATING');
    const [measurements, setMeasurements] = useState([]);

    // Collect data
    useEffect(() => {
        if ((status === 'ANALYZING' || status === 'CALIBRATING') && audioData) {
            // Calculate average volume (amplitude)
            const sum = audioData.reduce((a, b) => a + b, 0);
            const avg = sum / audioData.length;
            if (avg > 5) { // Filter silence
                setMeasurements(prev => [...prev, avg]);
            }
        }
    }, [audioData, status]);

    const handleStart = (e) => {
        e.preventDefault();
        if (status !== 'IDLE') return;

        // TRICK LOGIC
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // 0 to 0.4: TRUE (Left side)
        // 0.6 to 1.0: LIE (Right side)
        // 0.4 to 0.6: REAL ANALYIS (Center)

        const ratio = x / width;
        let forcedOutcome = null;

        if (ratio < 0.4) {
            forcedOutcome = 'TRUE';
        } else if (ratio > 0.6) {
            forcedOutcome = 'LIE';
        }
        // If center, forcedOutcome is null -> Real Analysis

        setMeasurements([]); // clear previous
        setStatus('ANALYZING');
        playSound('start');

        // Analysis Sequence
        let steps = 0;
        const interval = setInterval(() => {
            steps++;
            const texts = [
                "LISTENING TO VOICE...",
                "ANALYZING PITCH...",
                "DETECTING HESITATION...",
                "MEASURING STRESS LEVELS...",
                "DETECTING SWEAT RESPONSE...",
                "CALCULATING PROBABILITY..."
            ];
            setScanText(texts[Math.floor(Math.random() * texts.length)]);
            playSound('analyzing');
        }, 600);

        setTimeout(() => {
            clearInterval(interval);

            let finalResult = 'TRUE';

            if (forcedOutcome) {
                finalResult = forcedOutcome;
            } else {
                // REAL ANALYSIS LOGIC
                // Compare current measurements to baseline
                if (!baseline) {
                    // If no calibration, random
                    finalResult = Math.random() > 0.5 ? 'TRUE' : 'LIE';
                } else {
                    if (measurements.length === 0) {
                        // Silence = Suspicious = LIE
                        finalResult = 'LIE';
                    } else {
                        const currentAvg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
                        // If 20% louder than baseline = Stress (LIE)
                        // Or if variance is high (jitter) - too complex, stick to volume/stress
                        if (currentAvg > baseline.volume * 1.2) {
                            finalResult = 'LIE';
                        } else {
                            finalResult = 'TRUE';
                        }
                    }
                }
            }

            setStatus(finalResult === 'TRUE' ? 'RESULT_TRUE' : 'RESULT_LIE');
            playSound(finalResult === 'TRUE' ? 'true' : 'lie');
        }, 5000);
    };

    const handleCalibrate = (e) => {
        e.stopPropagation(); // Prevents clicking the main button
        setMeasurements([]);
        setStatus('CALIBRATING');
        setScanText("SAY: 'MY NAME IS...'");
        playSound('start');

        setTimeout(() => {
            // Finish Calibration
            if (measurements.length > 0) {
                const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
                setBaseline({ volume: avg });
                alert("CALIBRATION COMPLETE");
            } else {
                setBaseline({ volume: 50 }); // Default fallback
                alert("CALIBRATION FAILED (Too quiet). Using defaults.");
            }
            setStatus('IDLE');
            setScanText('READY');
        }, 3000);
    };

    const handleReset = () => {
        setStatus('IDLE');
        setScanText('READY');
    };

    return (
        <div className="w-screen h-screen relative bg-cyber-black text-cyber-green overflow-hidden selection:bg-cyber-green selection:text-black font-mono">
            <CameraFeed />
            <div className="noise"></div>
            <div className="scanline"></div>
            <div className="img-scan"></div>
            <Header />

            <main className="relative z-20 w-full h-full flex flex-col items-center justify-center p-4">

                {/* BACKGROUND GRID */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

                <AnimatePresence mode="wait">

                    {status === 'IDLE' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
                            className="flex flex-col items-center gap-12"
                        >
                            <div className="relative group cursor-pointer"
                                onPointerDown={handleStart}
                            >
                                {/* DECO RINGS */}
                                <div className="absolute inset-0 -m-4 rounded-full border border-cyber-green/30 scale-110 animate-pulse"></div>
                                <div className="absolute inset-0 -m-4 rounded-full border-t-2 border-r-2 border-cyber-green animate-spin duration-[4s]"></div>
                                <div className="absolute inset-0 -m-8 rounded-full border-b-2 border-l-2 border-cyber-green/50 animate-spin duration-[6s] direction-reverse"></div>

                                <div className="bg-cyber-black/80 border border-cyber-green p-10 rounded-full hover:bg-cyber-green/20 transition-all duration-300 active:scale-95">
                                    <Fingerprint className="w-24 h-24 md:w-32 md:h-32 text-cyber-green drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]" />
                                </div>

                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs tracking-[0.3em] font-bold text-cyber-green/80 animate-pulse">
                                    TOUCH TO START
                                </div>

                                {/* CALIBRATE BUTTON (Small) */}
                                <button
                                    onClick={handleCalibrate}
                                    className="absolute -bottom-24 left-1/2 -translate-x-1/2 text-[10px] text-cyber-green/30 hover:text-cyber-green border border-transparent hover:border-cyber-green/30 px-2 py-1 tracking-widest transition-all"
                                >
                                    [ CALIBRATE SENSORS ]
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {status === 'CALIBRATING' && (
                        <motion.div
                            key="calibrating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="text-xl tracking-widest text-cyber-green animate-pulse">{scanText}</div>
                            <div className="w-16 h-1 bg-cyber-green/50 overflow-hidden">
                                <motion.div
                                    className="h-full bg-cyber-green"
                                    animate={{ scaleX: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {status === 'ANALYZING' && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center w-full max-w-md gap-8"
                        >                          <div className="w-full h-48 border-2 border-cyber-green/30 bg-black/80 relative overflow-hidden flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.1)]">
                                {/* Real Audio Visualization */}
                                <div className="flex items-end gap-0.5 w-full h-full px-2 py-4 justify-center">
                                    {Array.from(audioData).slice(0, 32).map((value, i) => {
                                        // Fallback animation if no audio (value is 0)
                                        const height = value > 0
                                            ? `${(value / 255) * 100}%`
                                            : "10%";

                                        return (
                                            <motion.div
                                                key={i}
                                                className="flex-1 bg-cyber-green/80 hover:bg-cyber-green"
                                                style={{ height }}
                                                animate={value === 0 ? {
                                                    height: ["10%", "30%", "10%"],
                                                    opacity: [0.3, 0.6, 0.3]
                                                } : {}}
                                                transition={value === 0 ? {
                                                    duration: 0.5,
                                                    repeat: Infinity,
                                                    delay: i * 0.1,
                                                    ease: "easeInOut"
                                                } : { type: "tween", ease: "linear", duration: 0.05 }}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-cyber-green/50">
                                    <Mic className="w-3 h-3 animate-pulse" />
                                    LISTENING
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="text-xl md:text-2xl tracking-widest animate-pulse text-center font-bold text-cyber-green drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]">
                                    {scanText}
                                </div>
                                <div className="text-xs text-cyber-green/50">PROCESSING VOICE DATA...</div>
                            </div>

                            <div className="w-full h-1 bg-cyber-green/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                    className="h-full bg-cyber-green shadow-[0_0_10px_rgba(0,255,65,1)]"
                                />
                            </div>
                        </motion.div>
                    )}

                    {status === 'RESULT_TRUE' && (
                        <motion.div
                            key="true"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-8 relative z-50"
                        >
                            <div className="border-4 border-cyber-green p-10 rounded-xl bg-cyber-green/10 shadow-[0_0_100px_rgba(0,255,65,0.2)]">
                                <CheckCircle className="w-32 h-32 text-cyber-green mb-6 mx-auto drop-shadow-[0_0_20px_rgba(0,255,65,0.8)]" />
                                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-cyber-green drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">TRUE</h1>
                            </div>
                            <div className="text-cyber-green/80 tracking-[0.5em] text-lg font-bold">
                                VERIFIED
                            </div>
                            <button
                                onClick={handleReset}
                                className="mt-8 px-10 py-4 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-black transition-all duration-300 uppercase tracking-widest font-bold text-sm shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:shadow-[0_0_40px_rgba(0,255,65,0.5)]"
                            >
                                RESET SYSTEM
                            </button>
                            {/* CONFETTI or PARTICLES could go here, but kept simple for performance */}
                        </motion.div>
                    )}

                    {status === 'RESULT_LIE' && (
                        <motion.div
                            key="lie"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-8 relative z-50"
                        >
                            <div className="border-4 border-cyber-red p-10 rounded-xl bg-cyber-red/10 shadow-[0_0_100px_rgba(255,0,60,0.3)] animate-pulse">
                                <AlertTriangle className="w-32 h-32 text-cyber-red mb-6 mx-auto drop-shadow-[0_0_20px_rgba(255,0,60,0.8)]" />
                                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-cyber-red drop-shadow-[0_0_10px_rgba(255,0,60,0.5)]">LIE</h1>
                            </div>
                            <div className="text-cyber-red/80 tracking-[0.5em] text-lg font-bold">
                                DECEPTION DETECTED
                            </div>
                            <button
                                onClick={handleReset}
                                className="mt-8 px-10 py-4 border border-cyber-red text-cyber-red hover:bg-cyber-red hover:text-black transition-all duration-300 uppercase tracking-widest font-bold text-sm shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_40px_rgba(255,0,60,0.5)]"
                            >
                                RESET SYSTEM
                            </button>

                            {/* Warning overlay */}
                            <div className="fixed inset-0 border-[20px] border-cyber-red/30 pointer-events-none animate-pulse z-40 box-border"></div>
                            <div className="fixed inset-0 bg-cyber-red/10 pointer-events-none z-0"></div>
                        </motion.div>
                    )}

                </AnimatePresence>

            </main>
            <Footer />
        </div>
    )
}
