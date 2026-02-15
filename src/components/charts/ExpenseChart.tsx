import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactionStore } from '../../store/useTransactionStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c', '#d0ed57', '#8dd1e1', '#a4c8e0'];

export function ExpenseChart() {
    const transactions = useTransactionStore((state) => state.transactions);

    const data = useMemo(() => {
        const expenses = transactions.filter((t) => t.type === 'expense');
        const totals: Record<string, number> = {};

        expenses.forEach((t) => {
            if (!totals[t.category]) {
                totals[t.category] = 0;
            }
            totals[t.category] += t.amount;
        });

        return Object.entries(totals).map(([name, value]) => ({
            name,
            value,
        })).sort((a, b) => b.value - a.value);
    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                No expense data available.
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, 'Amount']}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
