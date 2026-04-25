"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

// ─── Emoji palette she can pick from ─────────────────────────────────────────
const AVATAR_OPTIONS = [
  '🌸','🌙','✨','💫','🌺','🦋','🌻','🌷','🍓','🫧',
  '🌈','⭐','💖','🌊','🍀','🌙','🪷','🎀','🌹','💎',
  '🔮','🧿','🫀','🌌','🪐','✦','⟡','◈','❋','⍙',
];

// ─── Colour swatches ──────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { label: 'Rose',     hex: '#ec4899' },
  { label: 'Amber',    hex: '#F59E0B' },
  { label: 'Violet',   hex: '#A78BFA' },
  { label: 'Teal',     hex: '#14B8A6' },
  { label: 'Crimson',  hex: '#DC2626' },
  { label: 'Cyan',     hex: '#0ea5e9' },
  { label: 'Lime',     hex: '#84cc16' },
  { label: 'Pearl',    hex: '#D4D4D8' },
  { label: 'Gold',     hex: '#fbbf24' },
  { label: 'Lavender', hex: '#c4b5fd' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FieldStatus {
  profile: SaveStatus;
  password: SaveStatus;
}

export default function ProfileSettings({ onClose }: { onClose?: () => void }) {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as any;

  // ── Local state mirrors the user's current values ──────────────────────────
  const [displayName,  setDisplayName]  = useState('');
  const [username,     setUsername]     = useState('');
  const [avatarEmoji,  setAvatarEmoji]  = useState('✦');
  const [accentColor,  setAccentColor]  = useState('#ec4899');

  const [currentPw,    setCurrentPw]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');

  const [fieldStatus,  setFieldStatus]  = useState<FieldStatus>({ profile: 'idle', password: 'idle' });
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [activeTab,    setActiveTab]    = useState<'identity' | 'security'>('identity');

  // Seed from session on mount
  useEffect(() => {
    if (user) {
      setDisplayName(user.name      || '');
      setAvatarEmoji(user.avatarEmoji || '✦');
      setAccentColor(user.accentColor || '#ec4899');
      // username isn't in the JWT by default — we'll fetch it
    }
  }, [user]);

  // ── Save profile (display_name, username, avatar_emoji, accent_color) ───────
  const saveProfile = async () => {
    setFieldStatus(s => ({ ...s, profile: 'saving' }));
    setErrorMsg(null);

    const payload: Record<string, string> = {
      display_name: displayName.trim(),
      avatar_emoji: avatarEmoji,
      accent_color: accentColor,
    };
    if (username.trim()) payload.username = username.trim();

    const res  = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Update failed.');
      setFieldStatus(s => ({ ...s, profile: 'error' }));
      setTimeout(() => setFieldStatus(s => ({ ...s, profile: 'idle' })), 3000);
      return;
    }

    // Refresh the NextAuth session so the header/avatar updates live
    await updateSession({ name: displayName.trim(), avatarEmoji, accentColor });
    // Push new accent colour to CSS variable immediately
    document.documentElement.style.setProperty('--accent', accentColor);

    setFieldStatus(s => ({ ...s, profile: 'saved' }));
    setTimeout(() => setFieldStatus(s => ({ ...s, profile: 'idle' })), 3000);
  };

  // ── Save password ─────────────────────────────────────────────────────────
  const savePassword = async () => {
    setErrorMsg(null);
    if (newPw !== confirmPw) { setErrorMsg('Passwords do not match.'); return; }
    if (newPw.length < 6)    { setErrorMsg('Minimum 6 characters.'); return; }

    setFieldStatus(s => ({ ...s, password: 'saving' }));

    const res  = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error || 'Password update failed.');
      setFieldStatus(s => ({ ...s, password: 'error' }));
      setTimeout(() => setFieldStatus(s => ({ ...s, password: 'idle' })), 3000);
      return;
    }

    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setFieldStatus(s => ({ ...s, password: 'saved' }));
    setTimeout(() => setFieldStatus(s => ({ ...s, password: 'idle' })), 3000);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const statusLabel = (s: SaveStatus) => {
    if (s === 'saving') return 'TRANSMITTING...';
    if (s === 'saved')  return 'SYNC COMPLETE ✓';
    if (s === 'error')  return 'TRANSMISSION FAILED';
    return null;
  };
  const statusColor = (s: SaveStatus) => {
    if (s === 'saving') return 'text-amber-400';
    if (s === 'saved')  return 'text-green-400';
    if (s === 'error')  return 'text-red-500';
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      exit ={{ opacity: 0, scale: 0.97, y: 10  }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="w-full h-full flex flex-col font-mono text-[#F5F5F0] overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07] shrink-0"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-4">
          {/* Live avatar preview */}
          <motion.div
            key={avatarEmoji + accentColor}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1,   rotate: 0   }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border shrink-0"
            style={{
              borderColor: accentColor,
              background:  `${accentColor}18`,
              boxShadow:   `0 0 20px ${accentColor}40`,
            }}
          >
            {avatarEmoji}
          </motion.div>
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/30 mb-0.5">Identity_Module</div>
            <div className="text-sm font-black tracking-widest uppercase" style={{ color: accentColor }}>
              {displayName || user?.name || 'UNNAMED'}
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors text-sm">
            ✕
          </button>
        )}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-white/[0.07] shrink-0">
        {(['identity', 'security'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[9px] tracking-[0.35em] uppercase transition-colors duration-200 relative
              ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>
            {tab === 'identity' ? '◈  IDENTITY' : '⚿  SECURITY'}
            {activeTab === tab && (
              <motion.div layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scroll px-8 py-6">
        <AnimatePresence mode="wait">

          {/* ── IDENTITY TAB ─────────────────────────────────────────────── */}
          {activeTab === 'identity' && (
            <motion.div key="identity"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              className="flex flex-col gap-7">

              {/* Display name */}
              <Field label="DISPLAY_NAME" hint="Shown on your portal header">
                <TextInput value={displayName} onChange={setDisplayName}
                  placeholder={user?.name || 'Your name'} accentColor={accentColor} />
              </Field>

              {/* Username (login identifier) */}
              <Field label="LOGIN_IDENTIFIER" hint="What you type at the terminal to sign in">
                <TextInput value={username} onChange={setUsername}
                  placeholder="Current username" accentColor={accentColor} />
              </Field>

              {/* Avatar emoji picker */}
              <Field label="AVATAR_MODULE" hint="Pick an emblem to represent you">
                <div className="grid grid-cols-10 gap-1.5 mt-1">
                  {AVATAR_OPTIONS.map(em => (
                    <button key={em} onClick={() => setAvatarEmoji(em)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all duration-150
                        ${avatarEmoji === em
                          ? 'scale-110 border'
                          : 'opacity-50 hover:opacity-90 border border-transparent hover:border-white/20'}`}
                      style={avatarEmoji === em
                        ? { borderColor: accentColor, background: `${accentColor}20`, boxShadow: `0 0 10px ${accentColor}40` }
                        : { background: 'rgba(255,255,255,0.03)' }}>
                      {em}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Accent colour swatches */}
              <Field label="ACCENT_FREQUENCY" hint="Your portal's signature colour">
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.hex} onClick={() => setAccentColor(c.hex)}
                      title={c.label}
                      className="relative w-8 h-8 rounded-full transition-all duration-150 border-2"
                      style={{
                        backgroundColor: c.hex,
                        borderColor:      accentColor === c.hex ? '#fff' : 'transparent',
                        boxShadow:        accentColor === c.hex ? `0 0 12px ${c.hex}` : 'none',
                        transform:        accentColor === c.hex ? 'scale(1.2)' : 'scale(1)',
                      }}>
                      {accentColor === c.hex && (
                        <span className="absolute inset-0 flex items-center justify-center text-black text-[10px] font-black">✓</span>
                      )}
                    </button>
                  ))}
                  {/* Custom hex input */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-2 border-white/20 bg-transparent"
                      title="Custom colour" />
                    <span className="text-[8px] text-white/30 uppercase tracking-widest">custom</span>
                  </div>
                </div>
              </Field>

              {/* Save row */}
              <SaveRow onSave={saveProfile} status={fieldStatus.profile}
                statusLabel={statusLabel(fieldStatus.profile)}
                statusColor={statusColor(fieldStatus.profile)}
                accentColor={accentColor} errorMsg={errorMsg} />
            </motion.div>
          )}

          {/* ── SECURITY TAB ─────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <motion.div key="security"
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex flex-col gap-7">

              <div className="text-[9px] tracking-[0.3em] uppercase text-white/25 border border-white/[0.06] rounded-lg p-4"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                Passphrase is encrypted with bcrypt before storage.
                Your current passphrase is required to set a new one.
              </div>

              <Field label="CURRENT_PASSPHRASE">
                <PasswordInput value={currentPw} onChange={setCurrentPw}
                  placeholder="Enter current passphrase" accentColor={accentColor} />
              </Field>

              <Field label="NEW_PASSPHRASE" hint="Minimum 6 characters">
                <PasswordInput value={newPw} onChange={setNewPw}
                  placeholder="Enter new passphrase" accentColor={accentColor} />
                {/* Strength bar */}
                {newPw && (
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4].map(n => {
                      const score = Math.min(4, Math.floor(newPw.length / 3));
                      return (
                        <div key={n} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                          style={{ background: n <= score
                            ? (score <= 1 ? '#ef4444' : score <= 2 ? '#f59e0b' : score <= 3 ? '#84cc16' : '#22c55e')
                            : 'rgba(255,255,255,0.1)' }} />
                      );
                    })}
                  </div>
                )}
              </Field>

              <Field label="CONFIRM_NEW_PASSPHRASE">
                <PasswordInput value={confirmPw} onChange={setConfirmPw}
                  placeholder="Repeat new passphrase" accentColor={accentColor} />
                {confirmPw && newPw !== confirmPw && (
                  <div className="text-[9px] text-red-400 tracking-widest mt-1">MISMATCH DETECTED</div>
                )}
                {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                  <div className="text-[9px] text-green-400 tracking-widest mt-1">PASSPHRASES MATCH ✓</div>
                )}
              </Field>

              <SaveRow onSave={savePassword} status={fieldStatus.password}
                statusLabel={statusLabel(fieldStatus.password)}
                statusColor={statusColor(fieldStatus.password)}
                accentColor={accentColor} errorMsg={errorMsg}
                disabled={!currentPw || newPw !== confirmPw || newPw.length < 6}
                label="UPDATE PASSPHRASE" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label className="text-[8px] tracking-[0.4em] uppercase text-white/40">{label}</label>
        {hint && <span className="text-[7px] tracking-widest text-white/20 uppercase">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, accentColor }: {
  value: string; onChange: (v: string) => void; placeholder?: string; accentColor: string;
}) {
  return (
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      autoComplete="off" autoCapitalize="off" spellCheck={false}
      className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90
                 placeholder-white/20 outline-none transition-all duration-200 tracking-widest"
      onFocus={e  => e.target.style.borderColor = accentColor}
      onBlur={e   => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
  );
}

function PasswordInput({ value, onChange, placeholder, accentColor }: {
  value: string; onChange: (v: string) => void; placeholder?: string; accentColor: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white/90
                   placeholder-white/20 outline-none transition-all duration-200 tracking-widest"
        onFocus={e => e.target.style.borderColor = accentColor}
        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 hover:text-white/70 transition-colors font-mono uppercase tracking-wider">
        {show ? 'HIDE' : 'SHOW'}
      </button>
    </div>
  );
}

function SaveRow({ onSave, status, statusLabel, statusColor, accentColor, errorMsg, disabled = false, label = "SAVE CHANGES" }: {
  onSave: () => void; status: SaveStatus; statusLabel: string | null; statusColor: string;
  accentColor: string; errorMsg?: string | null; disabled?: boolean; label?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-white/[0.07] gap-4">
      <div className="flex flex-col gap-1">
        {statusLabel && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-[8px] tracking-[0.35em] uppercase font-bold ${statusColor}`}>
            {statusLabel}
          </motion.span>
        )}
        {errorMsg && !statusLabel && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[8px] tracking-[0.25em] uppercase text-red-400">
            {errorMsg}
          </motion.span>
        )}
      </div>
      <button onClick={onSave} disabled={disabled || status === 'saving'}
        className="px-6 py-2.5 rounded-lg text-black font-black text-[9px] tracking-[0.35em] uppercase
                   transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0
                   hover:brightness-110 active:scale-95"
        style={{ background: accentColor, boxShadow: `0 0 16px ${accentColor}50` }}>
        {status === 'saving' ? '...' : label}
      </button>
    </div>
  );
}