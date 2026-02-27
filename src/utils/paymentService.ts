import api from './api';

export const paymentService = {
    verifyPaystackPayment: async (reference: string) => {
        const response = await api.post('/payments/paystack/verify', { reference });
        return response.data;
    },

    paystackWebhook: async (payload: any, signature: string) => {
        const response = await api.post('/payments/paystack/webhook', payload, {
            headers: {
                'X-Paystack-Signature': signature,
            },
        });
        return response.data;
    },
};
