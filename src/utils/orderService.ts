import api from './api';

export type OrderStatus = 'AWAITING_PAYMENT' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type BroadStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    food_item_id: string;
    quantity: number;
    price: number;
    image: {
        url: string;
        public_id: string;
    };
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    user_id: string;
    status: OrderStatus;
    price: number;
    payment_method: string;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
}

export interface ListOrdersResponse {
    code: string;
    data: Order[];
    meta: {
        page: number;
        per_page: number;
        total: number;
    };
}

export interface OrderDetailResponse {
    code: string;
    data: Order;
}

export const orderService = {
    listOrders: async (status: BroadStatus, page = 1, perPage = 10): Promise<ListOrdersResponse> => {
        try {
            const response = await api.get('/foods/orders', {
                params: { status, page, per_page: perPage }
            });
            return response.data;
        } catch (error: any) {
            console.error('List Orders Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getOrderDetails: async (id: string): Promise<OrderDetailResponse> => {
        try {
            const response = await api.get(`/foods/orders/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Order Details (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: OrderStatus): Promise<{ code: string }> => {
        try {
            const response = await api.put(`/foods/orders/${id}`, { status });
            return response.data;
        } catch (error: any) {
            console.error(`Update Order Status (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
