import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

/**
 * Hook to check if the other person (admin/user) is online
 * @param role - 'user' or 'admin' (your role)
 * @returns boolean indicating if the other person is online
 */
export function usePresence(role: 'user' | 'admin' = 'user') {
    const [otherOnline, setOtherOnline] = useState(false);

    useEffect(() => {
        const channel = supabase.channel('portal-presence', {
            config: { presence: { key: role } }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const targetRole = role === 'user' ? 'admin' : 'user';
                setOtherOnline(Object.keys(state).includes(targetRole));
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                const targetRole = role === 'user' ? 'admin' : 'user';
                if (key === targetRole) setOtherOnline(true);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                const targetRole = role === 'user' ? 'admin' : 'user';
                if (key === targetRole) setOtherOnline(false);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => { supabase.removeChannel(channel); };
    }, [role]);

    return otherOnline;
}
