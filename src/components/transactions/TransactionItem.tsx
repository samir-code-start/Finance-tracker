import { format } from 'date-fns';
import { ArrowUpRight, Coffee, ShoppingBag, Home, Zap, Car, Film, Heart, Briefcase, MoreHorizontal } from 'lucide-react';
import type { Transaction } from '../../types';
import { cn } from '../../utils/cn';

const categoryIcons: Record<string, any> = {
    'Food & Dining': Coffee,
    'Shopping': ShoppingBag,
    'Housing': Home,
    'Utilities': Zap,
    'Transportation': Car,
    'Entertainment': Film,
    'Healthcare': Heart,
    'Salary': Briefcase,
    'Investments': ArrowUpRight,
    'Other': MoreHorizontal,
};

interface TransactionItemProps {
    transaction: Transaction;
    onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
    const Icon = categoryIcons[transaction.category] || MoreHorizontal;
    const isIncome = transaction.type === 'income';

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-4">
                <div className={cn(
                    "p-2 rounded-full",
                    isIncome ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">{transaction.title}</h3>
                    <p className="text-sm text-gray-500">{transaction.category}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={cn(
                    "font-semibold",
                    isIncome ? "text-success" : "text-gray-900"
                )}>
                    {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                        {format(new Date(transaction.date), 'h:mm a')}
                    </p>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(transaction.id)}
                            className="text-gray-400 hover:text-danger transition-colors p-1"
                            title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
