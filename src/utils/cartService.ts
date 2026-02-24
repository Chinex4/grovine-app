import api from './api';
import { FoodItem } from './foodService';

export interface CartItem {
    id: string;
    food_id: string;
    quantity: number;
    food?: FoodItem;
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
}

export const cartService = {
    getCart: async (): Promise<CartResponse> => {
        try {
            const response = await api.get('/foods/carts');
            return response.data;
        } catch (error: any) {
            console.error('Get Cart Error:', error.response?.data || error.message);
            throw error;
        }
    },
    updateCart: async (foodItemId: string, quantity: number) => {
        try {
            // Using 'id' for the food item ID as per documentation
            const response = await api.put('/foods/carts', { id: foodItemId, quantity });
            return response.data;
        } catch (error: any) {
            console.error('Update Cart Error:', error.response?.data || error.message);
            throw error;
        }
    },
    checkout: async (params: CheckoutParams) => {
        try {
            const response = await api.post('/foods/carts/checkout', params);
            return response.data;
        } catch (error: any) {
            console.error('Checkout Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
