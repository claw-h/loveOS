"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Meteor {
    id: number;
    // We use vw/vh for initial placement to decouple from relative container sizes
    startX: number; 
    startY: number;
    duration: number;
    delay: number;
    width: number;
    thickness: number;
}

export default function CelestialEvents() {
    const [starTrigger, setStarTrigger] = useState(0);
    const [meteors, setMeteors] = useState<Meteor[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        
        const fireShower = () => {
            const newMeteors = Array.from({ length: 15 }).map((_, i) => ({
                id: Date.now() + i,
                // Spawn way outside the top-right
                startX: 50 + Math.random() * 80, // 50vw to 130vw
                startY: -20 + Math.random() * 50, // -20vh to 30vh
                // Faster entry speeds
                duration: Math.random() * 0.7 + 0.5,
                delay: Math.random() * 1.5,
                width: Math.random() * 200 + 150, 
                thickness: Math.random() * 2 + 2 
            }));
            
            setMeteors(newMeteors);
            window.setTimeout(() => setMeteors([]), 3500);
        };

        const initialStar = window.setTimeout(() => setStarTrigger(Date.now()), 1500);
        const initialShower = window.setTimeout(fireShower, 3500);
        const starInterval = window.setInterval(() => setStarTrigger(Date.now()), 15000);
        const showerInterval = window.setInterval(fireShower, 45000);
        
        return () => { 
            window.clearTimeout(initialStar);
            window.clearTimeout(initialShower);
            window.clearInterval(starInterval); 
            window.clearInterval(showerInterval); 
        };
    }, []);

    if (!isMounted) return null;

    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {/* The Big Bolide (Single Shooting Star) */}
            {starTrigger > 0 && (
                <motion.div
                    key={`star-${starTrigger}`}
                    initial={{ 
                        top: '-10vh', 
                        left: '90vw', 
                        x: 0,
                        y: 0,
                        rotate: 135, 
                        opacity: 0, 
                        scale: 0
                    }}
                    animate={{ 
                        // Using vw for BOTH axes guarantees a perfect 45-degree physical trajectory
                        x: '-150vw', 
                        y: '150vw', 
                        opacity: [0, 1, 1, 0],
                        scale: [0, 1.5, 2, 0] // Swells intensely then burns up
                    }}
                    transition={{ duration: 1.2, ease: "easeIn" }}
                    className="absolute bg-gradient-to-r from-transparent via-orange-400 to-white rounded-full"
                    style={{ 
                        width: '400px',
                        height: '6px',
                        boxShadow: '0 0 20px 2px rgba(253, 186, 116, 0.4)' 
                    }}
                >
                    {/* The super-heated atmospheric entry core */}
                    <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full"
                        style={{
                            width: '12px',
                            height: '12px',
                            boxShadow: '0 0 15px 5px #fff, 0 0 40px 15px #f97316, 0 0 60px 20px #ef4444'
                        }}
                    />
                    {/* Inner intense heat core (blueish/white) */}
                    <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#e0f2fe] rounded-full"
                        style={{ width: '6px', height: '6px', boxShadow: '0 0 10px 2px #bae6fd' }}
                    />
                </motion.div>
            )}

            {/* The Meteor Shower */}
            {meteors.map((meteor) => (
                <motion.div
                    key={meteor.id}
                    initial={{ 
                        top: `${meteor.startY}vh`, 
                        left: `${meteor.startX}vw`, 
                        x: 0,
                        y: 0,
                        rotate: 135, 
                        opacity: 0,
                        scale: 0.5
                    }}
                    animate={{ 
                        x: '-120vw', 
                        y: '120vw', 
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1, 1.2, 0]
                    }}
                    transition={{ 
                        duration: meteor.duration, 
                        delay: meteor.delay, 
                        ease: "easeIn" 
                    }}
                    className="absolute bg-gradient-to-r from-transparent via-orange-500 to-amber-100 rounded-full"
                    style={{ 
                        width: `${meteor.width}px`,
                        height: `${meteor.thickness}px`,
                        boxShadow: '0 0 10px 1px rgba(245, 158, 11, 0.3)'
                    }}
                >
                    {/* Glowing head */}
                    <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full"
                        style={{
                            width: `${meteor.thickness * 2}px`,
                            height: `${meteor.thickness * 2}px`,
                            boxShadow: '0 0 10px 2px #fff, 0 0 25px 6px #f59e0b'
                        }}
                    />
                </motion.div>
            ))}
        </div>
    );
}