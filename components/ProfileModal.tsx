"use client";

// ProfileModal.tsx
// Drop this file in your components folder.
// Import it in page.tsx with:
//   import ProfileModal from '@/components/ProfileModal';
// Then add state:
//   const [showProfile, setShowProfile] = useState(false);
// And render near the bottom of your JSX (inside the main div, above the closing tag):
//   <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
// To open it, call setShowProfile(true) from any button.

import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy import breaks the ESM boundary that was choking Turbopack
const ProfileSettings = lazy(() => import('@/components/ProfileSettings'));

export default function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return ()  => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit ={{ opacity: 0, scale: 0.96, y: 20  }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="fixed inset-0 z-[401] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="w-full max-w-lg max-h-[85vh] rounded-2xl border border-white/[0.08] overflow-hidden flex flex-col pointer-events-auto"
              style={{
                background:    'rgba(6,4,12,0.97)',
                backdropFilter:'blur(30px)',
                boxShadow:     '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center font-mono text-[9px] tracking-[0.4em] uppercase text-white/30 p-12">
                  LOADING MODULE...
                </div>
              }>
                <ProfileSettings onClose={onClose} />
              </Suspense>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}