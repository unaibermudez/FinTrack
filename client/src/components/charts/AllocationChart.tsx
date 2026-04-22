import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { HoldingResult } from '../../api/assets';
import { formatCurrency } from '../../utils/formatCurrency';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

interface Props {
  holdings: HoldingResult[];
}

export const AllocationChart = ({ holdings }: Props) => {
  const data = holdings.map((h) => ({ name: h.symbol, value: h.currentValue }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(val: number) => [formatCurrency(val), 'Value']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val) => <span className="text-xs text-slate-400">{val}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
