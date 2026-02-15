import { useForm } from 'react-hook-form';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useTransactionStore } from '../../store/useTransactionStore';

interface TransactionFormData {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    notes?: string;
}

const CATEGORIES = [
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

interface TransactionFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function TransactionForm({ onSuccess, onCancel }: TransactionFormProps) {
    const addTransaction = useTransactionStore((state) => state.addTransaction);
    const { register, handleSubmit, watch, formState: { errors } } = useForm<TransactionFormData>({
        defaultValues: {
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            category: 'Other'
        }
    });

    const transactionType = watch('type');

    const onSubmit = (data: TransactionFormData) => {
        addTransaction({
            ...data,
            amount: Number(data.amount),
        });
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-2 p-1 bg-gray-100 rounded-lg">
                <button
                    type="button"
                    onClick={() => {
                        (document.getElementsByName('type')[0] as any).value = 'income';
                        // Hacky, better to use setValue from useForm directly if I exposed it.
                        // Let's rely on hidden radio inputs or just styling.
                    }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${transactionType === 'income'
                        ? 'bg-white text-success shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <label className="flex items-center justify-center w-full h-full cursor-pointer">
                        <input
                            type="radio"
                            value="income"
                            className="sr-only"
                            {...register('type')}
                        />
                        Income
                    </label>
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${transactionType === 'expense'
                        ? 'bg-white text-danger shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <label className="flex items-center justify-center w-full h-full cursor-pointer">
                        <input
                            type="radio"
                            value="expense"
                            className="sr-only"
                            {...register('type')}
                        />
                        Expense
                    </label>
                </button>
            </div>

            <Input
                label="Title"
                placeholder="e.g. Grocery Shopping"
                {...register('title', { required: 'Title is required' })}
                error={errors.title?.message}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount', { required: 'Amount is required', min: 0.01 })}
                    error={errors.amount?.message}
                />
                <Input
                    label="Date"
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    error={errors.date?.message}
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                    {...register('category')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" variant={transactionType === 'income' ? 'success' : 'danger'}>
                    Add Transaction
                </Button>
            </div>
        </form>
    );
}
