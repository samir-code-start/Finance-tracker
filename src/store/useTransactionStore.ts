import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '../types';

interface TransactionState {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    removeTransaction: (id: string) => void;
    updateTransaction: (id: string, updatedTransaction: Partial<Transaction>) => void;
    getBalance: () => number;
    getIncome: () => number;
    getExpenses: () => number;
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set, get) => ({
            transactions: [],
            addTransaction: (transaction) =>
                set((state) => ({
                    transactions: [
                        { ...transaction, id: crypto.randomUUID() },
                        ...state.transactions,
                    ],
                })),
            removeTransaction: (id) =>
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                })),
            updateTransaction: (id, updatedTransaction) =>
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...updatedTransaction } : t
                    ),
                })),
            getBalance: () => {
                const { transactions } = get();
                return transactions.reduce(
                    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
                    0
                );
            },
            getIncome: () => {
                const { transactions } = get();
                return transactions
                    .filter((t) => t.type === 'income')
                    .reduce((acc, t) => acc + t.amount, 0);
            },
            getExpenses: () => {
                const { transactions } = get();
                return transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((acc, t) => acc + t.amount, 0);
            },
        }),
        {
            name: 'finance-tracker-storage',
        }
    )
);
