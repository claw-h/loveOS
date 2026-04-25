"use client";

import { motion } from "framer-motion";
import React from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#030303] min-h-screen relative overflow-hidden">
      
      {/* 1. THE ATMOSPHERE (GPU-Accelerated Light Leak) 
        Instead of calculating SVG smoke, we use a massive, heavily blurred CSS shape.
        It physically expands and fades, mimicking a dense fog clearing.
      */}
      <motion.div 
        initial={{ opacity: 1, scale: 0.8 }}
        animate={{ opacity: 0, scale: 1.5 }}
        transition={{ 
          duration: 1.5, 
          ease: [0.22, 1, 0.36, 1] // High-end cinematic curve
        }}
        style={{ willChange: "transform, opacity" }} // Forces hardware acceleration
        className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      >
        <div className="w-[150vw] h-[150vh] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_60%)] blur-3xl" />
      </motion.div>

      {/* 2. THE PAYLOAD (Flawless Optical Depth)
        Notice the 'willChange' property. This stops the "janky" stutter completely.
      */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.96, 
          filter: "blur(16px)", 
          y: 20 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          filter: "blur(0px)", 
          y: 0 
        }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1 // Just enough time for the DOM to settle before animating
        }}
        style={{ willChange: "transform, opacity, filter" }} // The secret to 60fps React transitions
        className="relative z-10 h-full w-full"
      >
        {children}
      </motion.div>

    </div>
  );
}