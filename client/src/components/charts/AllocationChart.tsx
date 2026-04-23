import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HoldingResult } from '../../api/assets';
import { formatCurrency } from '../../utils/formatCurrency';
import { useThemeStore } from '../../store/themeStore';

const COLORS_DARK  = ['#5B9BFF', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#22D3EE', '#FB923C'];
const COLORS_LIGHT = ['#1A56DB', '#047857', '#B45309', '#7C3AED', '#DB2777', '#0891B2', '#C2410C'];

interface Props { holdings: HoldingResult[]; }

export const AllocationChart = ({ holdings }: Props) => {
  const { theme } = useThemeStore();
  const COLORS = theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;
  const data = holdings.map((h) => ({ name: h.symbol, value: h.currentValue }));

  const tooltipStyle = {
    background: theme === 'dark' ? '#0D1928' : '#FFFFFF',
    border: `1px solid ${theme === 'dark' ? '#1C2E48' : '#D8E2F0'}`,
    borderRadius: 10,
    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
  };
  const labelStyle = { color: theme === 'dark' ? '#DDE8F5' : '#0B1729', fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={72}
          outerRadius={102}
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={labelStyle}
          itemStyle={{ color: theme === 'dark' ? '#DDE8F5' : '#0B1729', fontSize: 12 }}
          formatter={(val: number) => [formatCurrency(val), 'Value']}
        />
        <Legend
          iconType="circle"
          iconSize={7}
          formatter={(val) => (
            <span style={{ fontSize: 11, color: theme === 'dark' ? '#5E7A9E' : '#4A5E7A' }}>{val}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
