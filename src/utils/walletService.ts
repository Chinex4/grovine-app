import api from './api';

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    created_at: string;
    updated_at: string;
}

export const walletService = {
    fetchWallet: async (): Promise<{ data: Wallet }> => {
        try {
            const response = await api.get('/wallets');
            return response.data;
        } catch (error: any) {
            console.error('Fetch Wallet Error:', error.response?.data || error.message);
            throw error;
        }
    },
    topupWallet: async (amount: number): Promise<{ code: string }> => {
        try {
            const response = await api.post('/wallets/topup', { amount });
            return response.data;
        } catch (error: any) {
            console.error('Topup Wallet Error:', error.response?.data || error.message);
            throw error;
        }
    },
    withdraw: async (amount: number): Promise<{ code: string }> => {
        try {
            const response = await api.post('/wallets/withdraw', { amount });
            return response.data;
        } catch (error: any) {
            console.error('Withdrawal Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
