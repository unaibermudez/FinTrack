import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { HoldingResult } from '../../api/assets';
import { formatCurrency } from '../../utils/formatCurrency';
import { useThemeStore } from '../../store/themeStore';

interface Props { holdings: HoldingResult[]; }

export const HoldingsChart = ({ holdings }: Props) => {
  const { theme } = useThemeStore();
  const data = holdings.map((h) => ({ symbol: h.symbol, pl: h.plAbsolute }));

  const axisColor = theme === 'dark' ? '#5E7A9E' : '#8A9CB5';
  const tooltipStyle = {
    background: theme === 'dark' ? '#0D1928' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#1C2E48' : '#D8E2F0'}`,
    borderRadius: 10,
    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
  };
  const positiveColor = theme === 'dark' ? '#34D399' : '#047857';
  const negativeColor = theme === 'dark' ? '#F87171' : '#B91C1C';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="symbol"
          tick={{ fill: axisColor, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: axisColor, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v) => v >= 1000 || v <= -1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(val: number) => [formatCurrency(val), 'P&L']}
          labelStyle={{ color: theme === 'dark' ? '#DDE8F5' : '#0B1729', fontSize: 12 }}
          itemStyle={{ color: theme === 'dark' ? '#DDE8F5' : '#0B1729', fontSize: 12 }}
          cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
        />
        <Bar dataKey="pl" radius={[5, 5, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.pl >= 0 ? positiveColor : negativeColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
