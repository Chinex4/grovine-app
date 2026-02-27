import api from './api';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'AWAITING_PAYMENT' | 'PREPARING';
export type BroadStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
    id: string;
    food_item_id?: string;
    product_id?: string;
    quantity: number;
    price: number;
    image?: {
        url: string;
        public_id?: string;
    };
    product?: any;
    created_at?: string;
    updated_at?: string;
}

export interface Order {
    id: string;
    user_id?: string;
    status: OrderStatus;
    price: number;
    payment_method?: string;
    items: OrderItem[];
    created_at?: string;
    updated_at?: string;
}

export interface ListOrdersResponse {
    code?: string;
    data: Order[];
    meta: {
        page?: number;
        per_page?: number;
        total?: number;
        [key: string]: any;
    };
}

export interface OrderDetailResponse {
    code?: string;
    data: Order;
}

const extractArray = <T = any>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const extractMeta = (payload: any) => payload?.meta || payload?.data?.meta || {};

const normalizeOrder = (order: any): Order => ({
    ...order,
    id: String(order?.id ?? ''),
    status: order?.status ?? 'PENDING',
    price: Number(order?.price ?? order?.total ?? 0),
    items: Array.isArray(order?.items)
        ? order.items.map((item: any) => ({
            ...item,
            id: String(item?.id ?? ''),
            quantity: Number(item?.quantity ?? 0),
            price: Number(item?.price ?? 0),
            image: item?.image || item?.product?.image || item?.product?.media,
        }))
        : [],
});

const mapBucket = (status: BroadStatus) => {
    if (status === 'ONGOING') return 'ongoing';
    if (status === 'COMPLETED') return 'completed';
    if (status === 'CANCELLED') return 'cancelled';
    return 'all';
};

export const orderService = {
    listOrders: async (status: BroadStatus, page = 1, perPage = 10): Promise<ListOrdersResponse> => {
        try {
            const response = await api.get('/orders', {
                params: { bucket: mapBucket(status), page, per_page: perPage },
            });
            return {
                code: response.data?.code,
                data: extractArray(response.data).map(normalizeOrder),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List Orders Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getOrderDetails: async (id: string): Promise<OrderDetailResponse> => {
        try {
            const response = await api.get(`/orders/${id}`);
            return {
                code: response.data?.code,
                data: normalizeOrder(response.data?.data || response.data),
            };
        } catch (error: any) {
            console.error(`Get Order Details (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: OrderStatus): Promise<{ code?: string; message?: string }> => {
        try {
            const response = await api.patch(`/orders/${id}/status`, { status });
            return response.data;
        } catch (error: any) {
            console.error(`Update Order Status (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
};
