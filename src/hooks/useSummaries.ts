import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SummaryStats {
  period: string;
  period_start: string;
  period_end: string;
  days_logged: number;
  total_days: number;
  consistency_pct: number;
  avg_pain: number;
  prev_avg_pain: number | null;
  peak_pain_day: string | null;
  peak_pain_level: number | null;
  top_symptoms: { name: string; count: number; pct: number }[];
  top_relief: { name: string; count: number }[];
}

export interface AiSummary {
  id: string;
  period: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  language: string;
  created_at: string;
  content: {
    headline: string;
    highlights: string[];
    suggestions: string[];
    trend: 'improving' | 'stable' | 'worsening';
    stats: SummaryStats;
  };
}

export function useSummaries() {
  const [weekly, setWeekly]     = useState<AiSummary | null>(null);
  const [monthly, setMonthly]   = useState<AiSummary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [generating, setGenerating] = useState<'weekly' | 'monthly' | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ai_summaries')
        .select('*')
        .order('period_start', { ascending: false })
        .limit(10);

      if (data) {
        setWeekly((data.find((s: any) => s.period === 'weekly')  ?? null) as AiSummary | null);
        setMonthly((data.find((s: any) => s.period === 'monthly') ?? null) as AiSummary | null);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async (period: 'weekly' | 'monthly', lang: string) => {
    setGenerating(period);
    setGenError(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { period, language: lang, force: true },
      });
      if (error) throw new Error(error.message);
      if (data?.summary) {
        const s = data.summary as AiSummary;
        if (period === 'weekly')  setWeekly(s);
        else                      setMonthly(s);
      }
    } catch (e) {
      setGenError(String(e));
    } finally {
      setGenerating(null);
    }
  }, []);

  return { weekly, monthly, loading, generating, genError, load, generate };
}
