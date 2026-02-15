export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    date: string; // ISO string
    notes?: string;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    icon?: string;
    type: TransactionType;
}
