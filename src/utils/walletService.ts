import api from './api';

export interface Wallet {
    id?: string;
    user_id?: string;
    balance: number;
    currency?: string;
    created_at?: string;
    updated_at?: string;
}

export interface WalletBank {
    id: number;
    name: string;
    code: string;
    [key: string]: any;
}

export interface WalletPaymentTransaction {
    id: string;
    reference?: string | null;
    amount: string;
    currency: string;
    status: string;
    gateway_response?: any;
    [key: string]: any;
}

export interface InitializeDepositResponse {
    message?: string;
    data: {
        transaction?: WalletPaymentTransaction;
        authorization_url?: string;
        access_code?: string;
    };
}

export interface VerifyDepositResponse {
    message?: string;
    data: {
        transaction?: WalletPaymentTransaction;
        wallet_balance?: string;
    };
}

export interface VerifyBankAccountResponse {
    message?: string;
    data?: {
        account_name?: string;
        account_number?: string;
        bank_code?: string;
        raw?: any;
    };
}

export interface WithdrawResponse {
    message?: string;
    data?: {
        transaction?: WalletPaymentTransaction;
        wallet_balance?: string;
    };
}

const extractBalance = (payload: any): number => {
    const raw = payload?.balance ?? payload?.wallet_balance ?? payload?.available_balance ?? 0;
    return Number(raw);
};

export const walletService = {
    fetchWallet: async (): Promise<{ data: Wallet }> => {
        try {
            const response = await api.get('/wallet/balance');
            const payload = response.data?.data || response.data || {};
            return {
                data: {
                    ...payload,
                    balance: extractBalance(payload),
                    currency: payload?.currency || 'NGN',
                },
            };
        } catch (error: any) {
            console.error('Fetch Wallet Balance Error:', error.response?.data || error.message);
            throw error;
        }
    },

    topupWallet: async (amount: number, idempotencyKey?: string): Promise<InitializeDepositResponse> => {
        try {
            const response = await api.post(
                '/wallet/deposits/initialize',
                { amount },
                {
                    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
                }
            );
            const payload = response.data || {};
            const data = payload?.data || {};
            const transaction = data?.transaction || {};
            const authorizationUrl =
                data?.authorization_url ||
                transaction?.gateway_response?.data?.authorization_url ||
                transaction?.gateway_response?.authorization_url;

            return {
                message: payload?.message,
                data: {
                    transaction,
                    authorization_url: authorizationUrl,
                    access_code: data?.access_code || transaction?.gateway_response?.data?.access_code,
                },
            };
        } catch (error: any) {
            console.error('Initialize Wallet Deposit Error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyDeposit: async (reference: string): Promise<VerifyDepositResponse> => {
        try {
            const response = await api.post('/wallet/deposits/verify', { reference });
            const payload = response.data || {};
            return {
                message: payload?.message,
                data: {
                    transaction: payload?.data?.transaction,
                    wallet_balance: payload?.data?.wallet_balance,
                },
            };
        } catch (error: any) {
            console.error('Verify Wallet Deposit Error:', error.response?.data || error.message);
            throw error;
        }
    },

    listNigerianBanks: async (): Promise<{ data: WalletBank[] }> => {
        try {
            const response = await api.get('/wallet/banks/nigeria');
            return {
                data: Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [],
            };
        } catch (error: any) {
            console.error('List Nigerian Banks Error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyBankAccount: async (bankCode: string, accountNumber: string): Promise<VerifyBankAccountResponse> => {
        try {
            const response = await api.post('/wallet/verify-account', {
                bank_code: bankCode,
                account_number: accountNumber,
            });
            return response.data;
        } catch (error: any) {
            console.error('Verify Bank Account Error:', error.response?.data || error.message);
            throw error;
        }
    },

    withdraw: async (
        amount: number,
        payload?: {
            bank_code?: string;
            account_number?: string;
            account_name?: string;
            reason?: string;
            idempotency_key?: string;
        }
    ): Promise<WithdrawResponse> => {
        try {
            const response = await api.post(
                '/wallet/withdrawals',
                {
                    amount,
                    bank_code: payload?.bank_code,
                    account_number: payload?.account_number,
                    account_name: payload?.account_name,
                    reason: payload?.reason,
                },
                {
                    headers: payload?.idempotency_key ? { 'Idempotency-Key': payload.idempotency_key } : undefined,
                }
            );
            const body = response.data || {};
            return {
                ...body,
                data: {
                    ...body?.data,
                    wallet_balance: body?.data?.wallet_balance,
                    transaction: body?.data?.transaction,
                },
            };
        } catch (error: any) {
            console.error('Wallet Withdrawal Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
