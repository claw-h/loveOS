"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ─── MOOD PROFILES ────────────────────────────────────────────────────────────
// Each mood changes: trail color, glow color, shower frequency, bolide behavior
interface MoodProfile {
  trailVia: string;       // CSS color — the bright mid-trail
  trailTo: string;        // CSS color — the hot leading tip
  glowColor: string;      // rgba string for box-shadow
  headColor: string;      // the glowing nucleus
  showerFreqMs: number;   // how often a shower fires
  showerCount: number;    // how many meteors per shower
  bolideScale: number[];  // keyframes for bolide scale (intensity of entry)
  bolideDuration: number; // seconds for bolide to cross
  driftY: string;         // extra y-translate for LOW POWER lazy drift
  opacity: number;        // global opacity of the layer
  speed: 'fast' | 'normal' | 'slow' | 'frantic';
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  OPTIMAL: {
    trailVia:        '#fbbf24',
    trailTo:         '#fef3c7',
    glowColor:       'rgba(251,191,36,0.35)',
    headColor:       '#fff',
    showerFreqMs:    45000,
    showerCount:     15,
    bolideScale:     [0, 1.5, 2, 0],
    bolideDuration:  1.2,
    driftY:          '150vw',
    opacity:         1,
    speed:           'normal',
  },
  ANXIOUS: {
    trailVia:        '#c4b5fd',
    trailTo:         '#ede9fe',
    glowColor:       'rgba(167,139,250,0.4)',
    headColor:       '#ddd6fe',
    showerFreqMs:    18000,   // fires way more often — sky feels nervous
    showerCount:     22,
    bolideScale:     [0, 2.5, 1.5, 2, 0],
    bolideDuration:  0.7,     // blazes across fast
    driftY:          '150vw',
    opacity:         1,
    speed:           'fast',
  },
  'LOW POWER': {
    trailVia:        '#a1a1aa',
    trailTo:         '#e4e4e7',
    glowColor:       'rgba(212,212,216,0.2)',
    headColor:       '#e4e4e7',
    showerFreqMs:    90000,   // barely ever fires — exhausted sky
    showerCount:     5,
    bolideScale:     [0, 0.8, 0.6, 0],  // barely makes it
    bolideDuration:  2.4,     // drags across slowly
    driftY:          '80vw',  // doesn't even make it all the way
    opacity:         0.45,    // dim, faded
    speed:           'slow',
  },
  CRITICAL: {
    trailVia:        '#f87171',
    trailTo:         '#fecaca',
    glowColor:       'rgba(220,38,38,0.5)',
    headColor:       '#ff4444',
    showerFreqMs:    12000,   // relentless — crisis sky
    showerCount:     30,
    bolideScale:     [0, 3, 2.5, 3, 0],
    bolideDuration:  0.9,
    driftY:          '150vw',
    opacity:         1,
    speed:           'frantic',
  },
  MISSING_ADMIN: {
    trailVia:        '#2dd4bf',
    trailTo:         '#ccfbf1',
    glowColor:       'rgba(20,184,166,0.35)',
    headColor:       '#5eead4',
    showerFreqMs:    60000,
    showerCount:     8,
    bolideScale:     [0, 1, 1.2, 0.8, 0],
    bolideDuration:  1.8,     // wanders, searching
    driftY:          '120vw',
    opacity:         0.8,
    speed:           'slow',
  },
};

const DEFAULT_PROFILE = MOOD_PROFILES.OPTIMAL;

interface Meteor {
  id: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
  width: number;
  thickness: number;
}

interface CelestialEventsProps {
  moodLabel?: string;
}

export default function CelestialEvents({ moodLabel }: CelestialEventsProps) {
  const [starTrigger, setStarTrigger]   = useState(0);
  const [meteors, setMeteors]           = useState<Meteor[]>([]);
  const [isMounted, setIsMounted]       = useState(false);
  const profileRef                      = useRef<MoodProfile>(DEFAULT_PROFILE);
  const showerIntervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update profile ref when mood changes — no need to restart the whole effect
  const profile = MOOD_PROFILES[moodLabel ?? ''] ?? DEFAULT_PROFILE;
  useEffect(() => { profileRef.current = profile; }, [moodLabel]);

  // Speed multipliers
  const speedMultiplier = { fast: 0.55, normal: 1, slow: 1.8, frantic: 0.35 }[profile.speed];

  const fireShower = () => {
    const p = profileRef.current;
    const newMeteors: Meteor[] = Array.from({ length: p.showerCount }).map((_, i) => ({
      id:        Date.now() + i,
      startX:    50  + Math.random() * 80,
      startY:    -20 + Math.random() * 50,
      duration:  (Math.random() * 0.7 + 0.5) * speedMultiplier,
      delay:     Math.random() * (p.showerCount > 20 ? 1.0 : 1.8),
      width:     Math.random() * 200 + 150,
      thickness: Math.random() * 2 + 2,
    }));
    setMeteors(newMeteors);
    window.setTimeout(() => setMeteors([]), 4000);
  };

  // Restart shower interval when mood changes frequency
  useEffect(() => {
    if (!isMounted) return;
    if (showerIntervalRef.current) clearInterval(showerIntervalRef.current);
    showerIntervalRef.current = setInterval(fireShower, profile.showerFreqMs);
    return () => { if (showerIntervalRef.current) clearInterval(showerIntervalRef.current); };
  }, [profile.showerFreqMs, isMounted]);

  useEffect(() => {
    setIsMounted(true);

    const initialStar    = window.setTimeout(() => setStarTrigger(Date.now()), 1500);
    const initialShower  = window.setTimeout(fireShower, 3500);
    const starInterval   = window.setInterval(() => setStarTrigger(Date.now()), 15000);

    return () => {
      window.clearTimeout(initialStar);
      window.clearTimeout(initialShower);
      window.clearInterval(starInterval);
    };
  }, []);

  if (!isMounted) return null;

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-[2000ms]"
      style={{ opacity: profile.opacity }}
    >
      {/* ── THE BIG BOLIDE ── */}
      {starTrigger > 0 && (
        <motion.div
          key={`star-${starTrigger}`}
          initial={{ top: '-10vh', left: '90vw', x: 0, y: 0, rotate: 135, opacity: 0, scale: 0 }}
          animate={{
            x:       '-150vw',
            y:       profile.driftY,
            opacity: [0, 1, 1, 0],
            scale:   profile.bolideScale,
          }}
          transition={{ duration: profile.bolideDuration, ease: 'easeIn' }}
          className="absolute rounded-full"
          style={{
            width:    '400px',
            height:   '6px',
            background: `linear-gradient(to right, transparent, ${profile.trailVia}, ${profile.trailTo})`,
            boxShadow: `0 0 20px 2px ${profile.glowColor}`,
          }}
        >
          {/* Super-heated entry core */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width:    '12px',
              height:   '12px',
              backgroundColor: profile.headColor,
              boxShadow: `0 0 15px 5px ${profile.headColor}, 0 0 40px 15px ${profile.trailVia}, 0 0 60px 20px ${profile.trailVia}88`,
            }}
          />
          {/* Inner heat core */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ width: '6px', height: '6px', boxShadow: `0 0 10px 2px ${profile.headColor}` }}
          />
        </motion.div>
      )}

      {/* ── METEOR SHOWER ── */}
      {meteors.map((meteor) => (
        <motion.div
          key={meteor.id}
          initial={{
            top:     `${meteor.startY}vh`,
            left:    `${meteor.startX}vw`,
            x: 0, y: 0,
            rotate:  135,
            opacity: 0,
            scale:   0.5,
          }}
          animate={{
            x:       '-120vw',
            y:       '120vw',
            opacity: [0, 1, 1, 0],
            scale:   [0.5, 1, 1.2, 0],
          }}
          transition={{ duration: meteor.duration, delay: meteor.delay, ease: 'easeIn' }}
          className="absolute rounded-full"
          style={{
            width:    `${meteor.width}px`,
            height:   `${meteor.thickness}px`,
            background: `linear-gradient(to right, transparent, ${profile.trailVia}, ${profile.trailTo})`,
            boxShadow: `0 0 10px 1px ${profile.glowColor}`,
          }}
        >
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width:           `${meteor.thickness * 2}px`,
              height:          `${meteor.thickness * 2}px`,
              backgroundColor: profile.headColor,
              boxShadow:       `0 0 10px 2px ${profile.headColor}, 0 0 25px 6px ${profile.trailVia}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}