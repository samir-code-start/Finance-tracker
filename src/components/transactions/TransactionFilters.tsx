import type { ChangeEvent } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/Input';

interface TransactionFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    typeFilter: 'all' | 'income' | 'expense';
    setTypeFilter: (type: 'all' | 'income' | 'expense') => void;
    categoryFilter: string;
    setCategoryFilter: (category: string) => void;
}

const CATEGORIES = [
    'All Categories',
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Housing',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Salary',
    'Investments',
    'Other'
];

export function TransactionFilters({
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter
}: TransactionFiltersProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    value={searchQuery}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    placeholder="Search transactions..."
                    className="pl-9"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat === 'All Categories' ? 'all' : cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
