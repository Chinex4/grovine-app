import api from './api';

export interface RegisterDeviceTokenPayload {
    platform: 'android' | 'ios' | string;
    token: string;
    device_name?: string;
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    category?: string;
    is_read: boolean;
    action_url?: string | null;
    created_at?: string;
    [key: string]: any;
}

export interface NotificationsListResponse {
    message?: string;
    data: AppNotification[];
}

export interface UnreadCountResponse {
    message?: string;
    count: number;
}

const extractArray = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const normalizeNotification = (item: any): AppNotification => ({
    ...item,
    id: String(item?.id ?? ''),
    title: String(item?.title ?? item?.subject ?? 'Notification'),
    message: String(item?.message ?? item?.body ?? ''),
    category: item?.category,
    is_read: Boolean(item?.is_read ?? item?.read ?? false),
    action_url: item?.action_url ?? null,
    created_at: item?.created_at,
});

const extractUnreadCount = (payload: any): number => {
    const candidate =
        payload?.data?.unread_count ??
        payload?.data?.count ??
        payload?.unread_count ??
        payload?.count ??
        0;
    const parsed = Number(candidate);
    return Number.isNaN(parsed) ? 0 : parsed;
};

export const notificationService = {
    listNotifications: async (limit = 30): Promise<NotificationsListResponse> => {
        const response = await api.get('/notifications', { params: { limit } });
        const payload = response.data || {};
        return {
            message: payload?.message,
            data: extractArray(payload).map(normalizeNotification),
        };
    },

    getUnreadCount: async (): Promise<UnreadCountResponse> => {
        const response = await api.get('/notifications/unread-count');
        const payload = response.data || {};
        return {
            message: payload?.message,
            count: extractUnreadCount(payload),
        };
    },

    markRead: async (notificationId: string) => {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllRead: async () => {
        const response = await api.patch('/notifications/read-all');
        return response.data;
    },

    registerDeviceToken: async (payload: RegisterDeviceTokenPayload) => {
        const response = await api.post('/notifications/device-tokens', payload);
        return response.data;
    },

    removeDeviceToken: async (deviceTokenId: string) => {
        const response = await api.delete(`/notifications/device-tokens/${deviceTokenId}`);
        return response.data;
    },
};
