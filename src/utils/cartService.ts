import api from './api';
import { FoodItem } from './foodService';

export interface CartItem {
    id: string;
    food_id: string;
    product_id?: string;
    quantity: number;
    food?: FoodItem;
    product?: FoodItem;
}

export interface CartResponse {
    data: {
        items: CartItem[];
        total: number;
    };
}

export interface CheckoutParams {
    delivery: {
        type: 'NOW' | string;
        address: string;
        note_for_rider?: string;
    };
    payment_method: 'ONLINE' | 'WALLET' | 'PAY_FOR_ME';
    promo_code?: string;
    idempotency_key?: string;
}

const extractArray = <T = any>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

const normalizeCartItem = (item: any): CartItem => {
    const product = item?.product || item?.food;
    return {
        ...item,
        id: String(item?.id ?? ''),
        food_id: String(item?.food_id ?? item?.product_id ?? product?.id ?? ''),
        product_id: String(item?.product_id ?? item?.food_id ?? product?.id ?? ''),
        quantity: Number(item?.quantity ?? 0),
        food: product,
        product,
    };
};

const mapPaymentMethod = (paymentMethod: CheckoutParams['payment_method']) => {
    if (paymentMethod === 'WALLET') return 'wallet';
    if (paymentMethod === 'PAY_FOR_ME') return 'pay_for_me';
    return 'paystack';
};

export const cartService = {
    getCart: async (): Promise<CartResponse> => {
        try {
            const response = await api.get('/cart');
            const payload = response.data?.data || response.data || {};
            return {
                data: {
                    items: extractArray(payload).map(normalizeCartItem),
                    total: Number(payload?.total ?? payload?.subtotal ?? 0),
                },
            };
        } catch (error: any) {
            console.error('Get Cart Error:', error.response?.data || error.message);
            throw error;
        }
    },

    addCartItem: async (productId: string, quantity: number) => {
        try {
            const response = await api.post('/cart/items', {
                product_id: productId,
                quantity,
            });
            return response.data;
        } catch (error: any) {
            console.error('Add Cart Item Error:', error.response?.data || error.message);
            throw error;
        }
    },

    updateCart: async (cartItemId: string, quantity: number) => {
        try {
            if (quantity <= 0) {
                const response = await api.delete(`/cart/items/${cartItemId}`);
                return response.data;
            }

            const response = await api.patch(`/cart/items/${cartItemId}`, { quantity });
            return response.data;
        } catch (error: any) {
            console.error('Update Cart Error:', error.response?.data || error.message);
            throw error;
        }
    },

    removeCartItem: async (cartItemId: string) => {
        try {
            const response = await api.delete(`/cart/items/${cartItemId}`);
            return response.data;
        } catch (error: any) {
            console.error('Remove Cart Item Error:', error.response?.data || error.message);
            throw error;
        }
    },

    clearCart: async () => {
        try {
            const response = await api.delete('/cart');
            return response.data;
        } catch (error: any) {
            console.error('Clear Cart Error:', error.response?.data || error.message);
            throw error;
        }
    },

    checkout: async (params: CheckoutParams) => {
        try {
            const response = await api.post(
                '/checkout',
                {
                    payment_method: mapPaymentMethod(params.payment_method),
                    delivery_address: params.delivery.address,
                    rider_note: params.delivery.note_for_rider || '',
                    delivery_type: params.delivery.type === 'NOW' ? 'immediate' : String(params.delivery.type).toLowerCase(),
                    promo_code: params.promo_code,
                },
                {
                    headers: params.idempotency_key
                        ? { 'Idempotency-Key': params.idempotency_key }
                        : undefined,
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Checkout Error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyPaystackPayment: async (reference: string) => {
        try {
            const response = await api.post('/payments/paystack/verify', { reference });
            return response.data;
        } catch (error: any) {
            console.error('Verify Paystack Payment Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
