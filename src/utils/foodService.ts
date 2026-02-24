import api from './api';

export interface FoodItem {
    id: string;
    name: string;
    description: string;
    price: number;
    media: {
        public_id: string;
        url: string;
    };
    is_available: boolean;
    created_at: string;
    updated_at: string;
}

export interface FetchFoodsParams {
    page?: number;
    per_page?: number;
    categories?: string;
    name?: string;
}

export interface FetchFoodsResponse {
    data: FoodItem[];
    meta: {
        page: number;
        per_page: number;
        total: number;
    };
}

export const foodService = {
    fetchFoods: async (params: FetchFoodsParams): Promise<FetchFoodsResponse> => {
        try {
            console.log('Fetching foods with params:', params);
            const response = await api.get('/foods', { params });
            console.log('Fetch foods response count:', response.data.data.length);
            return response.data;
        } catch (error: any) {
            console.error('Fetch Foods API Error:', error.response?.data || error.message);
            throw error;
        }
    },
    fetchFoodItems: async (params: FetchFoodsParams): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/foods/items', { params });
            return response.data;
        } catch (error: any) {
            console.error('Fetch Food Items Error:', error.response?.data || error.message);
            throw error;
        }
    },
    fetchFoodById: async (id: string): Promise<{ data: FoodItem }> => {
        try {
            const response = await api.get(`/foods/items/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Fetch Food (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    createFoodItem: async (formData: FormData): Promise<{ data: FoodItem }> => {
        try {
            const response = await api.post('/foods/items', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error('Create Food Item Error:', error.response?.data || error.message);
            throw error;
        }
    },
    updateFoodItem: async (id: string, formData: FormData): Promise<{ data: FoodItem }> => {
        try {
            const response = await api.patch(`/foods/items/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error(`Update Food Item (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    deleteFoodItem: async (id: string): Promise<void> => {
        try {
            await api.delete(`/foods/items/${id}`);
        } catch (error: any) {
            console.error(`Delete Food Item (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
    fetchCategories: async (): Promise<{ data: string[] }> => {
        try {
            const response = await api.get('/foods/categories');
            return response.data;
        } catch (error: any) {
            console.error('Fetch Categories Error:', error.response?.data || error.message);
            throw error;
        }
    },
    fetchRegions: async (): Promise<{ data: string[] }> => {
        try {
            const response = await api.get('/foods/cuisine/regions');
            return response.data;
        } catch (error: any) {
            console.error('Fetch Regions Error:', error.response?.data || error.message);
            throw error;
        }
    },
    searchFoods: async (query: string): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/foods/search', { params: { q: query } });
            return response.data;
        } catch (error: any) {
            console.error('Search Foods Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
