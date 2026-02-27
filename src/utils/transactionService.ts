import api from './api';

export interface Transaction {
    id: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | string;
    direction: 'CREDIT' | 'DEBIT' | string;
    amount: number;
    purpose: string;
    description?: string;
    status?: string;
    reference?: string;
    balance_before?: number;
    balance_after?: number;
    created_at: string;
    updated_at?: string;
    [key: string]: any;
}

export interface ListTransactionsParams {
    page?: number;
    per_page?: number;
    limit?: number;
}

export interface ListTransactionsResponse {
    code?: string;
    data: {
        data: Transaction[];
        meta: {
            page?: number;
            per_page?: number;
            total?: number;
            [key: string]: any;
        };
    };
}

const extractArray = <T = any>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const normalizeTransaction = (item: any): Transaction => ({
    ...item,
    id: String(item?.id ?? ''),
    type: item?.type ?? 'DEPOSIT',
    direction: item?.direction ?? 'DEBIT',
    amount: Number(item?.amount ?? 0),
    purpose: item?.purpose ?? item?.type ?? item?.reference ?? 'TRANSACTION',
    description: item?.description ?? '',
    status: item?.status ?? '',
    reference: item?.reference ?? '',
    balance_before: Number(item?.balance_before ?? 0),
    balance_after: Number(item?.balance_after ?? 0),
    created_at: item?.created_at ?? new Date().toISOString(),
});

export const transactionService = {
    listTransactions: async (params: ListTransactionsParams = {}): Promise<ListTransactionsResponse> => {
        try {
            const response = await api.get('/wallet/transactions', {
                params: {
                    limit: params.limit ?? params.per_page,
                    page: params.page,
                },
            });

            const payload = response.data || {};
            return {
                code: payload?.code,
                data: {
                    data: extractArray(payload).map(normalizeTransaction),
                    meta: payload?.meta || payload?.data?.meta || {},
                },
            };
        } catch (error: any) {
            console.error('List Wallet Transactions Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getTransactionById: async (id: string): Promise<{ data: Transaction }> => {
        const listResponse = await transactionService.listTransactions({ limit: 100 });
        const transaction = listResponse.data.data.find((item) => item.id === id);
        if (!transaction) {
            throw new Error(`Transaction ${id} not found`);
        }
        return { data: transaction };
    },
};
