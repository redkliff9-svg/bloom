import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme';
import { useI18n } from '../i18n';
import { AiSummary } from '../hooks/useSummaries';

const TREND_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  improving: 'trending-down-outline',
  stable:    'remove-outline',
  worsening: 'trending-up-outline',
};
const TREND_COLOR = (c: ReturnType<typeof useColors>, trend: string) => {
  if (trend === 'improving') return '#4DB880';
  if (trend === 'worsening') return '#E05555';
  return c.MUTED;
};

interface Props {
  weekly:     AiSummary | null;
  monthly:    AiSummary | null;
  loading:    boolean;
  generating: 'weekly' | 'monthly' | null;
  genError:   string | null;
  onGenerate: (period: 'weekly' | 'monthly') => void;
  lang:       string;
}

export default function AISummarySection({ weekly, monthly, loading, generating, genError, onGenerate, lang }: Props) {
  const c  = useColors();
  const { t } = useI18n();
  const s  = useMemo(() => makeStyles(c), [c]);
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');

  const summary = tab === 'weekly' ? weekly : monthly;
  const isGen   = generating === tab;

  return (
    <View style={s.container}>
      {/* Header + tabs */}
      <View style={s.headerRow}>
        <View style={s.titleRow}>
          <Ionicons name="sparkles" size={16} color={c.PINK} />
          <Text style={s.title}>{t('ai_reports')}</Text>
        </View>
        <View style={s.tabs}>
          {(['weekly', 'monthly'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[s.tab, tab === p && s.tabActive]}
              onPress={() => setTab(p)}
            >
              <Text style={[s.tabTxt, tab === p && s.tabTxtActive]}>
                {t(p === 'weekly' ? 'ai_weekly' : 'ai_monthly')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={c.PINK} style={{ marginVertical: 24 }} />
      ) : summary ? (
        <SummaryView summary={summary} c={c} s={s} t={t} />
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyTxt}>{t('ai_no_report')}</Text>
          <Text style={s.emptyHint}>{t('ai_no_report_hint')}</Text>
        </View>
      )}

      {genError && (
        <Text style={s.error}>{t('ai_error')}</Text>
      )}

      <TouchableOpacity
        style={[s.genBtn, isGen && s.genBtnDisabled]}
        onPress={() => !isGen && onGenerate(tab)}
        disabled={isGen}
      >
        {isGen ? (
          <ActivityIndicator size="small" color={c.WHITE} />
        ) : (
          <Ionicons name="sparkles-outline" size={15} color={c.WHITE} />
        )}
        <Text style={s.genBtnTxt}>
          {isGen ? t('ai_generating') : t('ai_generate_now')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SummaryView({ summary, c, s, t }: {
  summary: AiSummary;
  c: ReturnType<typeof useColors>;
  s: ReturnType<typeof makeStyles>;
  t: (k: any) => string;
}) {
  const trend = summary.content.trend ?? 'stable';
  const trendColor = TREND_COLOR(c, trend);
  const trendIcon  = TREND_ICON[trend] ?? 'remove-outline';

  return (
    <>
      {/* Headline + trend badge */}
      <View style={s.headlineRow}>
        <Text style={s.headline}>{summary.content.headline}</Text>
        <View style={[s.trendBadge, { borderColor: trendColor }]}>
          <Ionicons name={trendIcon} size={13} color={trendColor} />
          <Text style={[s.trendTxt, { color: trendColor }]}>
            {t(`ai_${trend}` as any)}
          </Text>
        </View>
      </View>

      {/* Stats mini row */}
      {summary.content.stats && (
        <View style={s.statsRow}>
          <StatPill label="Logged" value={`${summary.content.stats.days_logged}/${summary.content.stats.total_days}d`} c={c} />
          <StatPill label="Avg pain" value={String(summary.content.stats.avg_pain)} c={c} />
          <StatPill label="Consistency" value={`${summary.content.stats.consistency_pct}%`} c={c} />
        </View>
      )}

      {/* Highlights */}
      {summary.content.highlights?.length > 0 && (
        <View style={s.section}>
          {summary.content.highlights.map((h, i) => (
            <View key={i} style={s.bulletRow}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.bulletTxt}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {summary.content.suggestions?.length > 0 && (
        <View style={s.suggestionsBox}>
          {summary.content.suggestions.map((sg, i) => (
            <View key={i} style={s.bulletRow}>
              <Ionicons name="checkmark-circle-outline" size={15} color={c.PINK} style={{ marginTop: 1 }} />
              <Text style={s.bulletTxt}>{sg}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={s.generatedAt}>
        {new Date(summary.created_at).toLocaleDateString()}
      </Text>
    </>
  );
}

function StatPill({ label, value, c }: { label: string; value: string; c: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: c.DARK }}>{value}</Text>
      <Text style={{ fontSize: 10, color: c.MUTED, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.SURFACE,
      borderRadius: 20,
      padding: 18,
      marginHorizontal: 16,
      marginBottom: 16,
      ...(c.card as object),
    },
    headerRow: { marginBottom: 14 },
    titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    title:     { fontSize: 15, fontWeight: '700', color: c.DARK },
    tabs: {
      flexDirection: 'row',
      backgroundColor: c.isDark ? '#1E1E2E' : '#F0F0F8',
      borderRadius: 10,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 6,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: { backgroundColor: c.PINK },
    tabTxt:    { fontSize: 13, fontWeight: '600', color: c.MUTED },
    tabTxtActive: { color: c.WHITE },
    empty:     { alignItems: 'center', paddingVertical: 20 },
    emptyTxt:  { fontSize: 15, fontWeight: '700', color: c.DARK, marginBottom: 6 },
    emptyHint: { fontSize: 13, color: c.MUTED, textAlign: 'center', lineHeight: 18 },
    error:     { fontSize: 13, color: '#E05555', textAlign: 'center', marginBottom: 10 },
    headlineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
    headline:  { flex: 1, fontSize: 14, fontWeight: '700', color: c.DARK, lineHeight: 20 },
    trendBadge:{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    trendTxt:  { fontSize: 11, fontWeight: '700' },
    statsRow:  { flexDirection: 'row', backgroundColor: c.isDark ? '#1A1A2A' : '#F7F7FB', borderRadius: 12, padding: 12, marginBottom: 14 },
    section:   { marginBottom: 12 },
    bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    bullet:    { fontSize: 16, color: c.PINK, lineHeight: 20 },
    bulletTxt: { flex: 1, fontSize: 13, color: c.DARK, lineHeight: 20 },
    suggestionsBox: {
      backgroundColor: c.isDark ? '#1E2A1E' : '#F0FAF4',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      gap: 8,
    },
    generatedAt: { fontSize: 11, color: c.MUTED, textAlign: 'right' },
    genBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.PINK,
      borderRadius: 14,
      paddingVertical: 11,
      marginTop: 4,
    },
    genBtnDisabled: { opacity: 0.6 },
    genBtnTxt: { fontSize: 14, fontWeight: '700', color: c.WHITE },
  });
}
