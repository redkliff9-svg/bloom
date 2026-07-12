import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface AiNudge {
  id: string;
  type: 'streak' | 'consistency' | 'pattern' | 'suggestion' | 'general';
  content: string;
  language: string;
  created_at: string;
  seen_at: string | null;
}

export function useNudge(lang: string) {
  const { session } = useAuth();
  const [nudge, setNudge]     = useState<AiNudge | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    load();
  }, [session?.user?.id]);

  async function load() {
    setLoading(true);
    try {
      // First: check DB for today's unseen nudge (avoids a function call)
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      const { data: cached } = await supabase
        .from('ai_nudges')
        .select('*')
        .gte('created_at', dayStart.toISOString())
        .is('seen_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) { setNudge(cached as AiNudge); return; }

      // No nudge yet today — ask the Edge Function to generate one
      const { data, error } = await supabase.functions.invoke('generate-nudge', {
        body: { language: lang },
      });

      if (!error && data?.nudge && !data.nudge.seen_at) {
        setNudge(data.nudge as AiNudge);
      }
    } catch {
      // Non-critical — fail silently
    } finally {
      setLoading(false);
    }
  }

  async function dismiss() {
    if (!nudge) return;
    setNudge(null); // optimistic
    await supabase
      .from('ai_nudges')
      .update({ seen_at: new Date().toISOString() })
      .eq('id', nudge.id);
  }

  return { nudge, loading, dismiss };
}
