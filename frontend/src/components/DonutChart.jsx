import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getCategoryMeta } from '../constants/categories'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { formatCurrency } from '../utils/format'

// No built-in Recharts <Legend> here on purpose - with 40+ possible categories
// it would overflow the card. Pair this with <CategoryLegendList> instead,
// which caps the legend to the top 5 with a "Show all" modal.
export default function DonutChart({ data, donut = true, height = 280 }) {
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)

  if (!data || data.length === 0) {
    return <p className="flex h-full items-center justify-center text-sm text-muted">No spending yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" innerRadius={donut ? 60 : 0} outerRadius={100} paddingAngle={2}>
          {data.map((entry) => (
            <Cell key={entry.category} fill={getCategoryMeta(entry.category).color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={chartTheme.tooltipStyle}
          labelStyle={chartTheme.labelStyle}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
