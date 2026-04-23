import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { HistoryPoint } from '../../api/assets';
import { formatCurrency } from '../../utils/formatCurrency';
import { useThemeStore } from '../../store/themeStore';

interface Props { data: HistoryPoint[]; }

export const HistoryChart = ({ data }: Props) => {
  const { theme } = useThemeStore();
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const padding = (max - min) * 0.12 || 100;

  const isPositive = data.length >= 2 ? data[data.length - 1].value >= data[0].value : true;
  const strokeColor = isPositive
    ? (theme === 'dark' ? '#34D399' : '#047857')
    : (theme === 'dark' ? '#F87171' : '#B91C1C');

  const axisColor = theme === 'dark' ? '#5E7A9E' : '#8A9CB5';
  const gridColor = theme === 'dark' ? '#1C2E48' : '#E8EFF8';
  const tooltipStyle = {
    background: theme === 'dark' ? '#0D1928' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#1C2E48' : '#D8E2F0'}`,
    borderRadius: 10,
    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  };

  const gradientId = `histGrad-${theme}`;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: axisColor, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
        />
        <YAxis
          tick={{ fill: axisColor, fontSize: 11, fontFamily: 'var(--font-mono)' }}
          axisLine={false}
          tickLine={false}
          width={72}
          domain={[min - padding, max + padding]}
          tickFormatter={(v) => v >= 1000 || v <= -1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: theme === 'dark' ? '#DDE8F5' : '#0B1729' }}
          itemStyle={{ color: theme === 'dark' ? '#DDE8F5' : '#0B1729' }}
          labelFormatter={(d) =>
            new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          }
          formatter={(val: number) => [formatCurrency(val), 'Value']}
          cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 2' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: strokeColor, stroke: theme === 'dark' ? '#0D1928' : '#FFFFFF', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
