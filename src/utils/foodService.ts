import api from './api';

export interface OptionItem {
    id: string;
    name: string;
    [key: string]: any;
}

export interface FoodItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    media: {
        public_id?: string;
        url: string;
    };
    image?: {
        public_id?: string;
        url: string;
    };
    stock?: number;
    is_recommended?: boolean;
    is_rush_hour_offer?: boolean;
    [key: string]: any;
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
        page?: number;
        per_page?: number;
        total?: number;
        [key: string]: any;
    };
}

const extractArray = <T = any>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const extractMeta = (payload: any) => payload?.meta || payload?.data?.meta || {};

const toOption = (item: any): OptionItem => {
    if (typeof item === 'string') {
        return { id: item, name: item };
    }
    return {
        id: String(item?.id ?? item?.name ?? item?.value ?? ''),
        name: String(item?.name ?? item?.title ?? item?.label ?? item?.id ?? ''),
        ...item,
    };
};

const normalizeProduct = (item: any): FoodItem => {
    const media = item?.media || item?.image || {};
    return {
        ...item,
        id: String(item?.id ?? ''),
        name: item?.name ?? '',
        price: Number(item?.price ?? 0),
        media: {
            public_id: media?.public_id,
            url: media?.url ?? '',
        },
        image: item?.image || media,
    };
};

export const foodService = {
    fetchFoods: async (params: FetchFoodsParams = {}): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/products', {
                params: {
                    page: params.page,
                    per_page: params.per_page,
                    category: params.categories,
                    q: params.name,
                },
            });
            return {
                data: extractArray(response.data).map(normalizeProduct),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('Fetch Products API Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchFoodItems: async (params: FetchFoodsParams = {}): Promise<FetchFoodsResponse> => {
        return foodService.fetchFoods(params);
    },

    fetchFoodById: async (id: string): Promise<{ data: FoodItem }> => {
        try {
            const response = await api.get(`/products/${id}`);
            const payload = response.data?.data || response.data;
            return { data: normalizeProduct(payload) };
        } catch (error: any) {
            console.error(`Fetch Product (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    fetchCategories: async (): Promise<{ data: string[] }> => {
        try {
            const response = await api.get('/categories');
            const categories = extractArray(response.data).map(toOption);
            return { data: categories.map((category) => category.name) };
        } catch (error: any) {
            console.error('Fetch Categories Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchCategoryOptions: async (): Promise<{ data: OptionItem[] }> => {
        const categories = await foodService.fetchRawCategories();
        return { data: categories.map(toOption) };
    },

    fetchFavoriteFoods: async (): Promise<{ data: string[] }> => {
        try {
            const response = await api.get('/preferences/favorite-foods');
            const foods = extractArray(response.data).map(toOption);
            return { data: foods.map((food) => food.name) };
        } catch (error: any) {
            console.error('Fetch Favorite Foods Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchFavoriteFoodOptions: async (): Promise<{ data: OptionItem[] }> => {
        try {
            const response = await api.get('/preferences/favorite-foods');
            return { data: extractArray(response.data).map(toOption) };
        } catch (error: any) {
            console.error('Fetch Favorite Food Options Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchRegions: async (): Promise<{ data: string[] }> => {
        try {
            const response = await api.get('/preferences/cuisine-regions');
            const regions = extractArray(response.data).map(toOption);
            return { data: regions.map((region) => region.name) };
        } catch (error: any) {
            console.error('Fetch Cuisine Regions Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchCuisineRegionOptions: async (): Promise<{ data: OptionItem[] }> => {
        try {
            const response = await api.get('/preferences/cuisine-regions');
            return { data: extractArray(response.data).map(toOption) };
        } catch (error: any) {
            console.error('Fetch Cuisine Region Options Error:', error.response?.data || error.message);
            throw error;
        }
    },

    searchFoods: async (query: string): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/products/search', { params: { q: query } });
            return {
                data: extractArray(response.data).map(normalizeProduct),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('Search Products Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchRecommendedProducts: async (): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/products/recommended');
            return {
                data: extractArray(response.data).map(normalizeProduct),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('Fetch Recommended Products Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchRushHourOffers: async (): Promise<FetchFoodsResponse> => {
        try {
            const response = await api.get('/products/rush-hour-offers');
            return {
                data: extractArray(response.data).map(normalizeProduct),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('Fetch Rush Hour Offers Error:', error.response?.data || error.message);
            throw error;
        }
    },

    fetchRawCategories: async (): Promise<any[]> => {
        const response = await api.get('/categories');
        return extractArray(response.data);
    },
};
