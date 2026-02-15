
import { TrendingUp, TrendingDown, Wallet, Plus, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useTransactionStore } from '../store/useTransactionStore';
import { TransactionList } from '../components/transactions/TransactionList';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { ExpenseChart } from '../components/charts/ExpenseChart';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { useState, useMemo } from 'react';

export function Dashboard() {
    const { transactions, getBalance, getIncome, getExpenses, removeTransaction } = useTransactionStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = typeFilter === 'all' || t.type === typeFilter;
            const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
            return matchesSearch && matchesType && matchesCategory;
        });
    }, [transactions, searchQuery, typeFilter, categoryFilter]);

    const balance = getBalance();
    const income = getIncome();
    const expenses = getExpenses();

    const stats = [
        {
            title: 'Total Balance',
            amount: `$${balance.toFixed(2)}`,
            trend: income > expenses ? 'up' : 'down',
            icon: Wallet,
            color: 'text-primary',
            bg: 'bg-primary-50',
        },
        {
            title: 'Income',
            amount: `$${income.toFixed(2)}`,
            trend: 'up',
            icon: TrendingUp,
            color: 'text-success',
            bg: 'bg-green-50',
        },
        {
            title: 'Expenses',
            amount: `$${expenses.toFixed(2)}`,
            trend: 'down',
            icon: TrendingDown,
            color: 'text-danger',
            bg: 'bg-red-50',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <div className="text-sm text-gray-500">
                        Overview of your financial activity
                    </div>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">
                                {stat.title}
                            </CardTitle>
                            <div className={cn('p-2 rounded-full', stat.bg, stat.color)}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.amount}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <TransactionFilters
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            typeFilter={typeFilter}
                            setTypeFilter={setTypeFilter}
                            categoryFilter={categoryFilter}
                            setCategoryFilter={setCategoryFilter}
                        />
                        <TransactionList
                            transactions={filteredTransactions}
                            onDelete={removeTransaction}
                        />
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="h-64">
                        <ExpenseChart />
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Transaction"
            >
                <TransactionForm
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
