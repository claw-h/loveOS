"use client";

import { useState, useRef, useEffect } from "react";
import { motion, PanInfo, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Coffee, CloudRain, Heart, Rocket } from "lucide-react";

type BotState = "idle" | "anticipating" | "happy";

interface CupidBotProps {
  isCompact: boolean;
  activeMoodId: string;
  onUnlock: (moodId: string) => void;
  onMoodChange: (moodId: string) => void;
}

const TypewriterText = ({ text, speed = 45 }: { text: string, speed?: number }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.slice(0, prev.length + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayedText}
      <span className="animate-pulse inline-block w-[6px] h-[10px] bg-current ml-1 align-baseline opacity-70" />
    </span>
  );
};

export default function CupidBot({ isCompact, activeMoodId, onUnlock, onMoodChange }: CupidBotProps) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [botState, setBotState] = useState<BotState>("idle");
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [sliderOpen, setSliderOpen] = useState(false);
  
  // --- AI COGNITIVE & AUTONOMY STATE ---
  const [chatInput, setChatInput] = useState("");
  const [botMessage, setBotMessage] = useState(""); 
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; parts: { text: string }[] }[]>([]);
  
  // NEW: The AI's physical overrides
  const [aiOverrideCompact, setAiOverrideCompact] = useState<boolean | null>(null);
  const [aiGesture, setAiGesture] = useState<string | null>(null);

  const currentPilot = "Boss"; 
  const [pokeCount, setPokeCount] = useState(0);
  const [isAnnoyed, setIsAnnoyed] = useState(false);
  const [isDraggingBot, setIsDraggingBot] = useState(false);
  const botRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 20 });
  const spotX = useMotionValue(100);
  const spotY = useMotionValue(100);
  const spotOpacity = useMotionValue(0);

  const tokens = [
    { id: "OPTIMAL", icon: <Rocket size={24} />, color: "text-[#10b981]", hex: "#10b981", bg: "bg-[#10b981]/10", border: "border-[#10b981]/50", shadow: "shadow-[#10b981]/20", label: "OPTIMAL" },
    { id: "CRITICAL", icon: <Heart size={24} />, color: "text-[#ef4444]", hex: "#ef4444", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/50", shadow: "shadow-[#ef4444]/20", label: "NEED LOVE" },
    { id: "ANXIOUS", icon: <CloudRain size={24} />, color: "text-[#f59e0b]", hex: "#f59e0b", bg: "bg-[#f59e0b]/10", border: "border-[#f59e0b]/50", shadow: "shadow-[#f59e0b]/20", label: "ANXIOUS" },
    { id: "LOW POWER", icon: <Coffee size={24} />, color: "text-[#6366f1]", hex: "#6366f1", bg: "bg-[#6366f1]/10", border: "border-[#6366f1]/50", shadow: "shadow-[#6366f1]/20", label: "LOW POWER" },
  ];

  const currentMoodId = activeToken || activeMoodId || "OPTIMAL";
  const activeColorHex = tokens.find(t => t.id === currentMoodId)?.hex || "#ffffff";

  // Calculate true layout state (AI overrides the parent prop if it wants to)
  const isActuallyCompact = aiOverrideCompact !== null ? aiOverrideCompact : isCompact;
  const isAiExpanded = aiOverrideCompact === false; // True if the AI expanded itself intentionally

  const handleCommunicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput(""); 
    setIsThinking(true);
    setBotMessage("Processing... ⚙️"); 

    try {
      const response = await fetch("/api/cupidbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userMessage,
          userName: currentPilot,
          history: chatHistory,
          annoyanceLevel: pokeCount,
        }),
      });

      const data = await response.json();
      
      if (data.message) {
        setBotMessage(data.message);
        setChatHistory(prev => [...prev, { role: "user", parts: [{ text: userMessage }] }, { role: "model", parts: [{ text: data.message }] }]);
        
        // --- NEW: AUTONOMOUS COMMAND CENTER ---
        if (data.action === "EXPAND") setAiOverrideCompact(false);
        if (data.action === "RETRACT") setAiOverrideCompact(true);
        
        if (data.gesture) {
          setAiGesture(data.gesture);
          // Auto-clear the gesture after 4 seconds so he stops waving
          setTimeout(() => setAiGesture(null), 4000); 
        }
      }
    } catch (error) {
      setBotMessage("Comm-link severed. 💔");
    } finally {
      setIsThinking(false);
    }
  };

  let floatSpeed = 4;
  let floatY = -6;
  if (currentMoodId === "CRITICAL") { floatSpeed = 0.5; floatY = -12; } 
  else if (currentMoodId === "ANXIOUS") { floatSpeed = 1.5; floatY = -8; } 
  else if (currentMoodId === "LOW POWER") { floatSpeed = 8; floatY = -3; } 

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (botState === "happy" || isActuallyCompact) return; 
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(nx * 12);
      mouseY.set(ny * 12);
    };
    window.addEventListener("mousemove", handleGlobalMove);
    return () => window.removeEventListener("mousemove", handleGlobalMove);
  }, [botState, isActuallyCompact, mouseX, mouseY]);

  useEffect(() => {
    if (botState === "happy") return;
    const blink = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), currentMoodId === "LOW POWER" ? 400 : 150); 
    }, Math.random() * (currentMoodId === "ANXIOUS" ? 2000 : 4000) + 1000); 
    return () => clearInterval(blink);
  }, [botState, currentMoodId]);

  const handleBotMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!botRef.current) return;
    const rect = botRef.current.getBoundingClientRect();
    spotX.set(e.clientX - rect.left);
    spotY.set(e.clientY - rect.top);
  };

  const handleBotDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingBot(false);
    if (Math.abs(info.offset.x) > 10 || Math.abs(info.offset.y) > 10) {
      setPokeCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= 4) {
          setIsAnnoyed(true);
          setBotMessage("UNAUTHORIZED KINETIC TRAUMA DETECTED. PLEASE REFRAIN FROM SHAKING THE CHASSIS.");
          setTimeout(() => { setIsAnnoyed(false); setPokeCount(0); setBotMessage(""); }, 7000); 
        }
        return newCount;
      });
    }
  };

  const handleTokenDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!botRef.current || isUploaded || isActuallyCompact) return;
    const botRect = botRef.current.getBoundingClientRect();
    const botCenterX = botRect.left + botRect.width / 2;
    const botCenterY = botRect.top + 70; 
    const dist = Math.sqrt(Math.pow(info.point.x - botCenterX, 2) + Math.pow(info.point.y - botCenterY, 2));
    if (dist < 120 && botState !== "anticipating") setBotState("anticipating");
    else if (dist >= 120 && botState === "anticipating") setBotState("idle");
  };

  const handleTokenDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, tokenId: string) => {
    if (!botRef.current || isUploaded || isActuallyCompact) return;
    const botRect = botRef.current.getBoundingClientRect();
    const botCenterX = botRect.left + botRect.width / 2;
    const botCenterY = botRect.top + 70;
    const dist = Math.sqrt(Math.pow(info.point.x - botCenterX, 2) + Math.pow(info.point.y - botCenterY, 2));

    if (dist < 120) {
      setIsUploaded(true);
      setBotState("happy");
      mouseX.set(0); mouseY.set(0); 
      setTimeout(() => { onUnlock(tokenId); setBotState("idle"); setActiveToken(null); }, 1800);
    } else {
      setActiveToken(null);
      setBotState("idle");
    }
  };

  let motorAnimate: any = { y: 0, x: 0, scale: 1 };
  let motorTransition: any = { type: "spring", stiffness: 300, damping: 20 };

  if (botState === "happy") {
    motorAnimate = { scale: [1, 1.1, 0.95, 1.05, 1], y: [0, -30, 0, -15, 0] };
    motorTransition = { duration: 0.8 };
  } else if (botState === "anticipating") {
    motorAnimate = { scale: 1.05, y: -10 };
  } else if (isDraggingBot) {
    motorAnimate = { scale: 1.05, y: 0, x: 0 };
  } else {
    // Injecting AI Gestures into the main motor block
    motorAnimate = { 
      y: isActuallyCompact ? 0 : [0, floatY, 0], 
      x: isAnnoyed ? [-4, 4, -4] : (aiGesture === "SHIVER" ? [-2, 2, -2] : 0) 
    };
    motorTransition = { 
      y: { repeat: Infinity, duration: floatSpeed, ease: "easeInOut" },
      x: (isAnnoyed || aiGesture === "SHIVER") ? { repeat: Infinity, duration: 0.08 } : { type: "spring", stiffness: 400, damping: 25 }
    };
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-[100] flex transition-all duration-1000 ${isActuallyCompact ? "items-end justify-end p-6 md:p-8" : "items-center justify-center pt-8"}`}>
      
      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.8, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="relative flex flex-col items-center justify-center z-20 pointer-events-auto"
      >
        <motion.div
          drag={true} dragSnapToOrigin={true} dragElastic={0.4} dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
          onDragStart={() => setIsDraggingBot(true)} onDragEnd={handleBotDragEnd}
          onTap={() => { if (isActuallyCompact && !botMessage) setSliderOpen(!sliderOpen); }}
          whileDrag={{ cursor: "grabbing" }} whileHover={isActuallyCompact ? { scale: 1.05 } : {}}
          className={`relative flex flex-col items-center justify-center ${!isActuallyCompact ? "cursor-grab" : "cursor-pointer"}`}
        >
          {/* AI THOUGHT BUBBLE */}
          <AnimatePresence>
            {botMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-[105%] mb-4 max-w-[240px] w-max p-4 rounded-2xl bg-black/80 backdrop-blur-md border z-50 pointer-events-none shadow-2xl"
                style={{ boxShadow: `0 0 30px ${activeColorHex}40`, borderColor: `${activeColorHex}60`, color: activeColorHex }}
              >
                <div className="text-xs font-mono leading-relaxed"><TypewriterText text={botMessage} speed={30} /></div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MOTOR WRAPPER */}
          <motion.div ref={botRef} animate={motorAnimate} transition={motorTransition} onMouseMove={handleBotMouseMove} onMouseEnter={() => spotOpacity.set(1)} onMouseLeave={() => spotOpacity.set(0)} className="relative flex flex-col items-center justify-center">
            
            {/* TINY HANDS - Wired to AI Gestures */}
            <motion.div 
              layout 
              animate={{ 
                scale: (!isActuallyCompact || isAnnoyed || aiGesture === "WAVE") ? 1 : 0, 
                opacity: (!isActuallyCompact || isAnnoyed || aiGesture === "WAVE") ? 1 : 0, 
                y: botState === "anticipating" ? -25 : (botState === "happy" ? -40 : 0), 
                rotate: aiGesture === "WAVE" ? [15, 120, 15] : (botState === "anticipating" ? 30 : (botState === "happy" ? 160 : (isAnnoyed ? 120 : 15))), 
                x: botState === "anticipating" ? -5 : 0 
              }} 
              transition={aiGesture === "WAVE" ? { repeat: Infinity, duration: 0.6 } : { type: "spring", stiffness: 200, damping: 15 }} 
              className="absolute left-1 top-[110px] w-3 h-12 rounded-full bg-[#080808]/90 border border-white/10 shadow-lg z-10 origin-bottom" style={{ borderColor: botState === "happy" || isActuallyCompact || isAnnoyed ? activeColorHex : 'rgba(255,255,255,0.1)' }} 
            />
            <motion.div 
              layout 
              animate={{ 
                scale: (!isActuallyCompact || isAnnoyed || aiGesture === "WAVE") ? 1 : 0, 
                opacity: (!isActuallyCompact || isAnnoyed || aiGesture === "WAVE") ? 1 : 0, 
                y: botState === "anticipating" ? -25 : (botState === "happy" ? -40 : 0), 
                rotate: aiGesture === "WAVE" ? [-15, -120, -15] : (botState === "anticipating" ? -30 : (botState === "happy" ? -160 : (isAnnoyed ? -120 : -15))), 
                x: botState === "anticipating" ? 5 : 0 
              }} 
              transition={aiGesture === "WAVE" ? { repeat: Infinity, duration: 0.6 } : { type: "spring", stiffness: 200, damping: 15 }} 
              className="absolute right-1 top-[110px] w-3 h-12 rounded-full bg-[#080808]/90 border border-white/10 shadow-lg z-10 origin-bottom" style={{ borderColor: botState === "happy" || isActuallyCompact || isAnnoyed ? activeColorHex : 'rgba(255,255,255,0.1)' }} 
            />

            {/* HEAD */}
            <motion.div layout animate={{ scale: (isActuallyCompact && !isAnnoyed) ? 0.7 : 1 }} className="relative flex flex-col items-center justify-center w-40 h-24 rounded-2xl bg-[#080808]/90 backdrop-blur-xl border border-white/5 shadow-2xl transition-colors duration-500 overflow-hidden z-20" style={{ borderColor: botState === "happy" || isActuallyCompact || isAnnoyed ? activeColorHex : 'rgba(255,255,255,0.08)' }}>
              <div className="flex gap-4 relative z-10 w-full justify-center">
                <motion.div animate={{ rotate: botState === "happy" ? -15 : (isAnnoyed ? 15 : (botState === "anticipating" ? 5 : 0)), y: botState === "happy" ? 4 : (botState === "anticipating" ? -2 : 0) }} className="w-12 h-12 rounded-[1rem] bg-black/80 shadow-inner flex items-center justify-center relative border border-white/5">
                  <motion.div animate={{ scaleY: isBlinking || botState === "happy" ? 0.1 : 1 }} className="w-4 h-4 rounded-full transition-colors duration-300" style={{ x: isActuallyCompact ? 0 : springX, y: isActuallyCompact ? 0 : springY, backgroundColor: activeColorHex, boxShadow: `0 0 12px ${activeColorHex}` }} />
                </motion.div>
                <motion.div animate={{ rotate: botState === "happy" ? 15 : (isAnnoyed ? -15 : (botState === "anticipating" ? -5 : 0)), y: botState === "happy" ? 4 : (botState === "anticipating" ? -2 : 0) }} className="w-12 h-12 rounded-[1rem] bg-black/80 shadow-inner flex items-center justify-center relative border border-white/5">
                  <motion.div animate={{ scaleY: isBlinking || botState === "happy" ? 0.1 : 1 }} className="w-4 h-4 rounded-full transition-colors duration-300" style={{ x: isActuallyCompact ? 0 : springX, y: isActuallyCompact ? 0 : springY, backgroundColor: activeColorHex, boxShadow: `0 0 12px ${activeColorHex}` }} />
                </motion.div>
              </div>
            </motion.div>

            {/* MECHANICAL NECK & BODY */}
            <motion.div layout animate={{ height: (isActuallyCompact && !isAnnoyed) ? 0 : (botState === "anticipating" ? 24 : 12), opacity: (isActuallyCompact && !isAnnoyed) ? 0 : 1 }} className="w-8 bg-white/5 border-l border-r border-black/50 z-10 shadow-inner" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }} />
            <motion.div layout animate={{ height: (isActuallyCompact && !isAnnoyed) ? 0 : 80, scale: (isActuallyCompact && !isAnnoyed) ? 0 : 1, opacity: (isActuallyCompact && !isAnnoyed) ? 0 : 1 }} className="relative w-32 rounded-[1.5rem] bg-[#080808]/90 backdrop-blur-xl border border-white/5 shadow-xl transition-colors duration-500 overflow-hidden flex flex-col items-center justify-center z-20" style={{ borderColor: botState === "happy" || isActuallyCompact || isAnnoyed ? activeColorHex : 'rgba(255,255,255,0.08)' }}>
              <motion.div animate={{ backgroundColor: activeColorHex, boxShadow: `0 0 20px ${activeColorHex}`, scale: botState === "anticipating" ? 1.2 : 1 }} className="w-6 h-6 rounded-full border border-white/10 z-10 transition-colors duration-500" />
            </motion.div>
          </motion.div>
          
          {/* INPUT FORM (Visible if compact OR if the AI expanded itself to chat) */}
          <AnimatePresence>
            {(isActuallyCompact || isAiExpanded) && (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleCommunicate} onPointerDown={(e) => e.stopPropagation()} className="absolute right-[110%] mr-4 top-1/2 -translate-y-1/2 flex w-64 gap-2 z-50 pointer-events-auto">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isThinking} placeholder="Ping CupidBot..." className="flex-1 px-4 py-2 bg-[#080808]/90 border border-white/10 rounded-full text-white text-xs focus:outline-none transition-colors disabled:opacity-50 shadow-lg backdrop-blur-md font-mono" style={{ outlineColor: activeColorHex }} />
                <button type="submit" disabled={isThinking || !chatInput.trim()} className="px-4 py-2 rounded-full text-black text-xs font-bold shadow-lg" style={{ backgroundColor: activeColorHex }}>{isThinking ? "..." : "SEND"}</button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* --- INSTRUCTIONS & TOKENS (RESTORED) --- */}
      <AnimatePresence>
        {!isActuallyCompact && (
          <motion.div exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute mt-72 text-center h-8 z-10 pointer-events-none max-w-xs">
            <div className={`font-mono text-xs tracking-[0.2em] uppercase drop-shadow-md p-3 rounded-lg bg-black/50 backdrop-blur-sm border transition-colors duration-300 border-white/5 text-white/50`}>
              {isUploaded ? <TypewriterText text="MODULE ACCEPTED. INTEGRATING..." /> : <TypewriterText text="AWAITING VIBE MODULE UPLOAD" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isUploaded && !isActuallyCompact && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ type: "spring", damping: 25, stiffness: 120, delay: 0.1 }} className="absolute bottom-16 flex gap-4 sm:gap-6 justify-center w-full z-20 px-4 pointer-events-auto">
            {tokens.map((token) => (
              <motion.div key={token.id} drag dragSnapToOrigin={true} onDragStart={() => setActiveToken(token.id)} onDrag={handleTokenDrag} onDragEnd={(e, info) => handleTokenDragEnd(e, info, token.id)} whileHover={{ scale: 1.1, y: -5 }} whileTap={{ scale: 0.9, cursor: "grabbing" }} className={`relative flex flex-col items-center gap-3 cursor-grab ${activeToken && activeToken !== token.id ? 'opacity-30' : 'opacity-100'}`} style={{ zIndex: activeToken === token.id ? 50 : 1 }}>
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center border backdrop-blur-md transition-all duration-300 ${token.bg} ${token.border} ${token.color} shadow-lg ${token.shadow}`}>
                  {token.icon}
                </div>
                <span className={`font-mono text-[9px] tracking-widest opacity-60 uppercase transition-colors duration-300 ${activeToken === token.id ? token.color : 'text-zinc-500'}`}>{token.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}