import api from './api';

export interface Advertisement {
    id: string;
    media: {
        public_id: string;
        url: string;
    };
    expires_at: string;
    title: string | null;
    description: string | null;
    target_url: string | null;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface ListAdsParams {
    page?: number;
    per_page?: number;
}

export interface ListAdsResponse {
    code: string;
    data: {
        data: Advertisement[];
        meta: {
            page: number;
            per_page: number;
            total: number;
        };
    };
}

export const adService = {
    fetchAds: async (params?: ListAdsParams): Promise<ListAdsResponse> => {
        try {
            const response = await api.get('/ads', { params });
            return response.data;
        } catch (error: any) {
            console.error('Fetch Ads Error:', error.response?.data || error.message);
            throw error;
        }
    },
    getAdById: async (id: string): Promise<{ data: Advertisement }> => {
        try {
            const response = await api.get(`/ads/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Ad (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    // Admin methods can be added later if needed
};
