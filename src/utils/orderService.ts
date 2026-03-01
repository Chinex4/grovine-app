import api from './api';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'AWAITING_PAYMENT' | 'PREPARING';
export type BroadStatus = 'ONGOING' | 'COMPLETED' | 'CANCELLED';

interface PaymentGatewayResponseData {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
}

interface PaymentGatewayResponse {
    data?: PaymentGatewayResponseData;
}

interface PaymentLike {
    reference?: string;
    status?: string;
    access_code?: string;
    gateway_response?: PaymentGatewayResponse;
}

export interface OrderItem {
    id: string;
    food_item_id?: string;
    product_id?: string;
    product_name?: string;
    product_image_url?: string;
    quantity: number;
    price: number;
    unit_price?: number;
    unit_discount?: number;
    line_total?: number;
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
    order_number?: string;
    user_id?: string;
    status: OrderStatus;
    payment_status?: string;
    price: number;
    subtotal?: number;
    total?: number;
    item_count?: number;
    currency?: string;
    payment_method?: string;
    payment_reference?: string | null;
    payment_authorization_url?: string | null;
    payment_access_code?: string | null;
    payment_transaction_status?: string | null;
    latest_paystack_payment?: PaymentLike;
    items: OrderItem[];
    delivery_address?: string;
    rider_note?: string;
    delivery_type?: string;
    scheduled_for?: string | null;
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

const normalizeMediaUrl = (url: unknown) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;

    const trimmed = url.replace(/^\/+/, '');
    if (!trimmed) return '';

    if (trimmed.startsWith('storage/')) {
        return `https://api.grovine.ng/${trimmed}`;
    }

    if (trimmed.startsWith('products/') || trimmed.startsWith('categories/') || trimmed.startsWith('recipes/')) {
        return `https://api.grovine.ng/storage/${trimmed}`;
    }

    return `https://api.grovine.ng/${trimmed}`;
};

const resolvePaymentFromOrder = (order: any): PaymentLike | null => {
    if (order?.latest_paystack_payment) return order.latest_paystack_payment;
    if (Array.isArray(order?.payments) && order.payments.length > 0) return order.payments[0];
    return null;
};

const normalizeOrder = (order: any): Order => {
    const payment = resolvePaymentFromOrder(order);
    const total = Number(order?.total ?? order?.price ?? 0);
    const subtotal = Number(order?.subtotal ?? total);
    const items = Array.isArray(order?.items)
        ? order.items.map((item: any) => {
            const quantity = Number(item?.quantity ?? 0);
            const unitPrice = Number(item?.unit_price ?? item?.price ?? 0);
            const unitDiscount = Number(item?.unit_discount ?? 0);
            const lineTotal = Number(item?.line_total ?? unitPrice * quantity);
            const imageUrl = normalizeMediaUrl(
                item?.product_image_url ||
                item?.image_url ||
                item?.image?.url ||
                item?.product?.image_url ||
                item?.product?.image?.url ||
                item?.product?.media?.url
            );

            return {
                ...item,
                id: String(item?.id ?? ''),
                quantity,
                price: unitPrice,
                unit_price: unitPrice,
                unit_discount: unitDiscount,
                line_total: lineTotal,
                product_name: item?.product_name ?? item?.product?.name ?? '',
                product_image_url: imageUrl,
                image: {
                    public_id: item?.image?.public_id ?? item?.product?.image?.public_id ?? item?.product?.media?.public_id,
                    url: imageUrl,
                },
            };
        })
        : [];

    const paymentAuthorizationUrl =
        order?.payment_authorization_url ??
        payment?.gateway_response?.data?.authorization_url ??
        null;

    const paymentReference =
        order?.payment_reference ??
        payment?.reference ??
        payment?.gateway_response?.data?.reference ??
        null;

    const paymentAccessCode =
        order?.payment_access_code ??
        payment?.access_code ??
        payment?.gateway_response?.data?.access_code ??
        null;

    const paymentStatus = order?.payment_transaction_status ?? payment?.status ?? null;

    return {
        ...order,
        id: String(order?.id ?? ''),
        order_number: order?.order_number ? String(order.order_number) : undefined,
        status: (order?.status ?? 'PENDING') as OrderStatus,
        payment_status: order?.payment_status ? String(order.payment_status) : undefined,
        price: total,
        subtotal,
        total,
        item_count: Number(order?.item_count ?? items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)),
        currency: order?.currency ? String(order.currency) : undefined,
        payment_method: order?.payment_method ? String(order.payment_method) : undefined,
        payment_reference: paymentReference,
        payment_authorization_url: paymentAuthorizationUrl,
        payment_access_code: paymentAccessCode,
        payment_transaction_status: paymentStatus ? String(paymentStatus) : null,
        latest_paystack_payment: payment ?? undefined,
        items,
        delivery_address: order?.delivery_address ? String(order.delivery_address) : undefined,
        rider_note: order?.rider_note ? String(order.rider_note) : undefined,
        delivery_type: order?.delivery_type ? String(order.delivery_type) : undefined,
        scheduled_for: order?.scheduled_for ?? null,
        created_at: order?.created_at,
        updated_at: order?.updated_at,
    };
};

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
