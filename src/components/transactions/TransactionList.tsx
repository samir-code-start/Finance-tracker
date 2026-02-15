import { useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import type { Transaction } from '../../types';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
    transactions: Transaction[];
    onDelete?: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};

        transactions.forEach(transaction => {
            const dateKey = format(new Date(transaction.date), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(transaction);
        });

        // Sort dates descending
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [transactions]);

    if (transactions.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No transactions found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {groupedTransactions.map(([date, dateTransactions]) => {
                const dateObj = new Date(date);
                let dateLabel = format(dateObj, 'MMMM d, yyyy');
                if (isToday(dateObj)) dateLabel = 'Today';
                if (isYesterday(dateObj)) dateLabel = 'Yesterday';

                // Calculate daily total
                const dailyTotal = dateTransactions.reduce((acc, t) =>
                    acc + (t.type === 'income' ? t.amount : -t.amount), 0
                );

                return (
                    <div key={date}>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <h3 className="text-sm font-medium text-gray-500">{dateLabel}</h3>
                            <span className="text-xs font-semibold text-gray-400">
                                {dailyTotal >= 0 ? '+' : ''}${dailyTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {dateTransactions.map(transaction => (
                                <TransactionItem
                                    key={transaction.id}
                                    transaction={transaction}
                                    onDelete={onDelete}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
