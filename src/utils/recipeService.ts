import api from './api';

export interface RecipeIngredient {
    id: string;
    quantity: string;
    name?: string; // Optional if joined with food categories/items
}

export interface RecipeInstruction {
    title: string;
    content: string;
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    chef_id: string;
    chef_name?: string;
    chef_avatar?: string;
    price: string | number;
    rating: number;
    likes_count: number;
    dislikes_count: number;
    media: {
        video_url: string;
        cover_image_url: string;
    };
    ingredients: RecipeIngredient[];
    instructions: RecipeInstruction[];
    created_at: string;
    updated_at: string;
}

export interface ListRecipesParams {
    page?: number;
    per_page?: number;
}

export interface ListRecipesResponse {
    data: Recipe[];
    meta: {
        page: number;
        per_page: number;
        total: number;
    };
}

export const recipeService = {
    listRecipes: async (params?: ListRecipesParams): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/foods/recipes', { params });
            return response.data;
        } catch (error: any) {
            console.error('List Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getRecipeById: async (id: string): Promise<{ data: Recipe }> => {
        try {
            const response = await api.get(`/foods/recipes/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    createRecipe: async (formData: FormData): Promise<{ data: Recipe }> => {
        try {
            const response = await api.post('/foods/recipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error('Create Recipe Error:', error.response?.data || error.message);
            throw error;
        }
    },

    updateRecipe: async (id: string, formData: FormData): Promise<{ data: Recipe }> => {
        try {
            const response = await api.patch(`/foods/recipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch (error: any) {
            console.error(`Update Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteRecipe: async (id: string): Promise<void> => {
        try {
            await api.delete(`/foods/recipes/${id}`);
        } catch (error: any) {
            console.error(`Delete Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    likeRecipe: async (id: string): Promise<void> => {
        try {
            await api.put(`/foods/recipes/${id}/like`);
        } catch (error: any) {
            console.error(`Like Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    dislikeRecipe: async (id: string): Promise<void> => {
        try {
            await api.put(`/foods/recipes/${id}/dislike`);
        } catch (error: any) {
            console.error(`Dislike Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    rateRecipe: async (id: string, rating: number): Promise<void> => {
        try {
            await api.put(`/foods/recipes/${id}/rate`, { rating });
        } catch (error: any) {
            console.error(`Rate Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },
};
