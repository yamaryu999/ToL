import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Audio Context helper
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

export default function App() {
    const [status, setStatus] = useState('IDLE'); // IDLE, ANALYZING, RESULT_TRUE, RESULT_LIE
    const [scanText, setScanText] = useState('INITIALIZING...');

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
        // 0.4 to 0.6: Random

        const ratio = x / width;
        let outcome = 'TRUE';
        if (ratio < 0.4) {
            outcome = 'TRUE';
        } else if (ratio > 0.6) {
            outcome = 'LIE';
        } else {
            outcome = Math.random() > 0.5 ? 'TRUE' : 'LIE';
        }

        playSound('start');
        setStatus('ANALYZING');

        // Analysis Sequence
        let steps = 0;
        const interval = setInterval(() => {
            steps++;
            const texts = [
                "READING BIOMETRICS...",
                "ANALYZING MICRO-TREMORS...",
                "CHECKING VOICE PATTERN...",
                "CROSS-REFERENCING DATABASE...",
                "DETECTING SWEAT RESPONSE...",
                "CALCULATING PROBABILITY..."
            ];
            setScanText(texts[Math.floor(Math.random() * texts.length)]);
            playSound('analyzing');
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            setStatus(outcome === 'TRUE' ? 'RESULT_TRUE' : 'RESULT_LIE');
            playSound(outcome === 'TRUE' ? 'true' : 'lie');
        }, 4000); // 4 seconds analysis
    };

    const handleReset = () => {
        setStatus('IDLE');
        setScanText('READY');
    };

    return (
        <div className="w-screen h-screen relative bg-cyber-black text-cyber-green overflow-hidden selection:bg-cyber-green selection:text-black font-mono">
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
                        >
                            <div className="w-full h-48 border-2 border-cyber-green/30 bg-black/80 relative overflow-hidden flex items-center justify-center rounded-lg shadow-[0_0_20px_rgba(0,255,65,0.1)]">
                                {/* Fake Waveform */}
                                <div className="flex items-end gap-1 w-full h-full px-2 py-4">
                                    {[...Array(30)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex-1 bg-cyber-green"
                                            animate={{
                                                height: ["10%", "90%", "20%", "60%", "10%"],
                                                opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{
                                                duration: 0.2 + Math.random() * 0.3,
                                                repeat: Infinity,
                                                delay: i * 0.02,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="text-xl md:text-2xl tracking-widest animate-pulse text-center font-bold text-cyber-green drop-shadow-[0_0_5px_rgba(0,255,65,0.8)]">
                                    {scanText}
                                </div>
                                <div className="text-xs text-cyber-green/50">PROCESSING DATA STREAMS...</div>
                            </div>

                            <div className="w-full h-1 bg-cyber-green/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 4, ease: "linear" }}
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
