// Recharts renders raw SVG with inline color props - it doesn't see Tailwind's
// `dark:` classes or CSS variables for SVG attributes reliably, so chart
// colors are resolved to plain hex strings in JS instead, from the current
// theme + light/dark mode (passed in as `resolved`, from useTheme()).
export function getChartTheme(isDark, resolved = {}) {
  return {
    grid: resolved.cardBorder || (isDark ? '#374151' : '#f1f5f9'),
    tick: { fill: resolved.textSecondary || (isDark ? '#9ca3af' : '#6b7280'), fontSize: 11 },
    tooltipStyle: {
      backgroundColor: resolved.cardBg || (isDark ? '#1f2937' : '#ffffff'),
      border: `1px solid ${resolved.cardBorder || (isDark ? '#374151' : '#e5e7eb')}`,
      borderRadius: 8,
      color: resolved.textPrimary || (isDark ? '#f3f4f6' : '#111827'),
      fontSize: 13,
    },
    labelStyle: { color: resolved.textPrimary || (isDark ? '#f3f4f6' : '#111827') },
    accent: resolved.accent || '#3b82f6',
    income: resolved.income || '#16a34a',
    expense: resolved.expense || '#ef4444',
    savings: resolved.savings || '#0d9488',
  }
}
