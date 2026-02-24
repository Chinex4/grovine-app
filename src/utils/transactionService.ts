import api from './api';

export interface Transaction {
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    purpose: string;
    created_at: string;
    updated_at: string;
}

export interface ListTransactionsParams {
    page?: number;
    per_page?: number;
}

export interface ListTransactionsResponse {
    code: string;
    data: {
        data: Transaction[];
        meta: {
            page: number;
            per_page: number;
            total: number;
        };
    };
}

export const transactionService = {
    listTransactions: async (params?: ListTransactionsParams): Promise<ListTransactionsResponse> => {
        try {
            const response = await api.get('/transactions', { params });
            return response.data;
        } catch (error: any) {
            console.error('List Transactions Error:', error.response?.data || error.message);
            throw error;
        }
    },
    getTransactionById: async (id: string): Promise<{ data: Transaction }> => {
        try {
            const response = await api.get(`/transactions/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Transaction (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
};
