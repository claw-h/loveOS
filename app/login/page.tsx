"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "authenticating" | "granted" | "denied">("idle");
    const [bootText, setBootText] = useState("");

    const SYS_COLOR = "#ec4899"; // Pink for Mahi's portal vibe

    // Cool terminal typing effect on load
    useEffect(() => {
        const sequence = [
            "INITIALIZING SECURE CONNECTION...",
            "ESTABLISHING HANDSHAKE...",
            "WARNING: RESTRICTED MAINFRAME.",
            "PLEASE IDENTIFY YOURSELF."
        ];
        let i = 0;
        let currentText = "";
        
        const interval = setInterval(() => {
            if (i < sequence.length) {
                currentText += sequence[i] + "\n";
                setBootText(currentText);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 600);

        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setStatus("authenticating");

        // NOTE: If you are using standard Credentials provider in NextAuth, this will trigger it.
        // Change 'credentials' to whatever provider you set up in [...nextauth].ts if needed!
        const result = await signIn('credentials', {
            redirect: false,
            password: password,
        });

        if (result?.error) {
            setStatus("denied");
            setPassword("");
            setTimeout(() => setStatus("idle"), 3000);
        } else {
            setStatus("granted");
            // Give it 2 seconds to show the cool green "ACCESS GRANTED" animation before redirecting
            setTimeout(() => {
                window.location.href = '/'; // Or wherever her portal lives!
            }, 2000);
        }
    };

    return (
        <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-mono text-white selection:bg-pink-500/30">
            
            <style jsx global>{`
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                .animate-scanline {
                    animation: scanline 8s linear infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
            `}</style>

            {/* Old CRT Monitor Effects */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/5 to-transparent opacity-20 animate-scanline pointer-events-none z-40"></div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg z-10"
            >
                {/* Terminal Window */}
                <div className="border border-white/10 bg-black/60 backdrop-blur-xl rounded-lg overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.1)] relative">
                    
                    {/* Fake Window Header */}
                    <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-[10px] text-white/40 uppercase tracking-widest">login.exe</span>
                    </div>

                    <div className="p-6 md:p-8 min-h-[300px] flex flex-col">
                        
                        {/* Status Outputs */}
                        <div className="whitespace-pre-line text-sm md:text-base text-pink-400/80 leading-relaxed mb-8 flex-1">
                            {bootText}
                            
                            <AnimatePresence mode="wait">
                                {status === "authenticating" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-yellow-400">
                                        &gt; VERIFYING ENCRYPTION KEYS...
                                    </motion.div>
                                )}
                                {status === "denied" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-500 font-bold">
                                        &gt; ERROR 401: UNAUTHORIZED. INTRUDER DETECTED.
                                    </motion.div>
                                )}
                                {status === "granted" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-green-400 font-bold">
                                        &gt; BIOMETRICS CONFIRMED. WELCOME BACK.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Form */}
                        {status !== "granted" && (
                            <form onSubmit={handleLogin} className="mt-auto relative">
                                <div className="flex items-center text-xl md:text-2xl text-white/80">
                                    <span className="text-pink-500 mr-3">&gt;</span>
                                    <input
                                        type="password"
                                        autoFocus
                                        disabled={status === "authenticating"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent border-none outline-none w-full text-white placeholder-white/20 tracking-widest"
                                        placeholder="ENTER_PASSPHRASE"
                                    />
                                    {/* Fake Blinking Cursor */}
                                    <span className="w-3 h-6 bg-pink-500 ml-1 animate-blink inline-block"></span>
                                </div>
                                <div className="h-px w-full bg-gradient-to-r from-pink-500/50 to-transparent mt-2"></div>
                            </form>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}