import api from './api';

export interface Chef {
    id: string;
    name: string;
    niches: string[];
    profile_picture: {
        public_id: string;
        url: string;
    } | null;
    rating: number;
    likes: number;
    dislikes: number;
    is_verified: boolean;
    is_banned: boolean;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface RegisterChefParams {
    name: string;
    niches: string[];
}

export interface UpdateChefParams {
    name?: string;
    niches?: string[];
    profile_picture?: any; // multipart/form-data
}

export interface ListChefsParams {
    page?: number;
    per_page?: number;
}

export interface ListChefsResponse {
    code: string;
    data: {
        data: Chef[];
        meta: {
            page: number;
            per_page: number;
            total: number;
        };
    };
}

export const chefService = {
    registerChef: async (params: RegisterChefParams): Promise<{ code: string; data: Chef }> => {
        try {
            const response = await api.post('/chefs', params);
            return response.data;
        } catch (error: any) {
            console.error('Register Chef Error:', error.response?.data || error.message);
            throw error;
        }
    },
    listChefs: async (params?: ListChefsParams): Promise<ListChefsResponse> => {
        try {
            const response = await api.get('/chefs', { params });
            return response.data;
        } catch (error: any) {
            console.error('List Chefs Error:', error.response?.data || error.message);
            throw error;
        }
    },
    getOwnProfile: async (): Promise<{ code: string; data: Chef }> => {
        try {
            const response = await api.get('/chefs/profile');
            return response.data;
        } catch (error: any) {
            console.error('Get Own Chef Profile Error:', error.response?.data || error.message);
            throw error;
        }
    },
    updateProfile: async (params: UpdateChefParams): Promise<{ code: string; data: Chef }> => {
        try {
            const formData = new FormData();
            if (params.name) formData.append('name', params.name);
            if (params.niches) {
                params.niches.forEach(niche => formData.append('niches[]', niche));
            }
            if (params.profile_picture) {
                formData.append('profile_picture', params.profile_picture);
            }

            const response = await api.patch('/chefs/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error('Update Chef Profile Error:', error.response?.data || error.message);
            throw error;
        }
    },
    getChefById: async (id: string): Promise<{ code: string; data: Chef }> => {
        try {
            const response = await api.get(`/chefs/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Chef (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    likeChef: async (id: string): Promise<{ code: string }> => {
        try {
            const response = await api.put(`/chefs/${id}/like`);
            return response.data;
        } catch (error: any) {
            console.error(`Like Chef (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    dislikeChef: async (id: string): Promise<{ code: string }> => {
        try {
            const response = await api.put(`/chefs/${id}/dislike`);
            return response.data;
        } catch (error: any) {
            console.error(`Dislike Chef (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    rateChef: async (id: string, rating: number): Promise<{ code: string }> => {
        try {
            const response = await api.put(`/chefs/${id}/rate`, { rating });
            return response.data;
        } catch (error: any) {
            console.error(`Rate Chef (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
};
