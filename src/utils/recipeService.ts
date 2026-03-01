import api from './api';

export interface RecipeIngredient {
    id: string;
    quantity: string;
    name?: string;
    product_id?: string;
    item_text?: string;
    is_optional?: boolean;
}

export interface RecipeInstruction {
    title: string;
    content: string;
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    short_description?: string;
    chef_id: string;
    chef_name?: string;
    chef_avatar?: string;
    price: string | number;
    status?: string;
    estimated_cost?: string | number;
    duration_seconds?: number;
    servings?: number;
    is_quick_recipe?: boolean;
    rating: number;
    likes_count: number;
    dislikes_count: number;
    media: {
        video_url?: string;
        cover_image_url?: string;
    };
    ingredients: RecipeIngredient[];
    instructions: RecipeInstruction[];
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface ListRecipesParams {
    page?: number;
    per_page?: number;
    q?: string;
    status?: string;
}

export interface ListRecipesResponse {
    data: Recipe[];
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

const normalizeMediaUrl = (url: unknown) => {
    if (!url || typeof url !== 'string') return '';
    if (/^https?:\/\//i.test(url)) return url;

    const trimmed = url.replace(/^\/+/, '');
    if (!trimmed) return '';

    if (trimmed.startsWith('storage/')) {
        return `https://api.grovine.ng/${trimmed}`;
    }

    if (trimmed.startsWith('recipes/') || trimmed.startsWith('products/') || trimmed.startsWith('categories/')) {
        return `https://api.grovine.ng/storage/${trimmed}`;
    }

    return `https://api.grovine.ng/${trimmed}`;
};

const normalizeInstructions = (instructions: any): RecipeInstruction[] => {
    if (Array.isArray(instructions)) {
        return instructions.map((instruction: any, index) => ({
            title: instruction?.title || `Step ${index + 1}`,
            content: instruction?.content || instruction?.text || '',
        }));
    }

    if (typeof instructions === 'string' && instructions.trim()) {
        return instructions
            .split('\n')
            .filter(Boolean)
            .map((line: string, index: number) => ({
                title: `Step ${index + 1}`,
                content: line,
            }));
    }

    return [];
};

const normalizeIngredients = (ingredients: any): RecipeIngredient[] => {
    if (!Array.isArray(ingredients)) return [];
    return ingredients.map((ingredient: any) => ({
        id: String(ingredient?.id ?? ingredient?.product_id ?? ingredient?.item_text ?? ''),
        quantity: String(ingredient?.quantity ?? ingredient?.cart_quantity ?? ''),
        name: ingredient?.name ?? ingredient?.item_text ?? ingredient?.product?.name ?? '',
        product_id: ingredient?.product_id,
        item_text: ingredient?.item_text ?? ingredient?.name ?? ingredient?.product?.name,
        is_optional: Boolean(ingredient?.is_optional),
    }));
};

const normalizeRecipe = (recipe: any): Recipe => {
    const media = recipe?.media || {};
    const chef = recipe?.chef || recipe?.chef_profile || {};
    const coverImageUrl = normalizeMediaUrl(media?.cover_image_url ?? media?.cover_image?.url ?? recipe?.cover_image_url);
    const videoUrl = normalizeMediaUrl(media?.video_url ?? media?.video?.url ?? recipe?.video_url);

    return {
        ...recipe,
        id: String(recipe?.id ?? ''),
        title: recipe?.title ?? '',
        description: recipe?.description ?? recipe?.short_description ?? '',
        short_description: recipe?.short_description ?? recipe?.description ?? '',
        chef_id: String(recipe?.chef_id ?? chef?.id ?? ''),
        chef_name: recipe?.chef_name ?? chef?.chef_name ?? chef?.name,
        chef_avatar: normalizeMediaUrl(recipe?.chef_avatar ?? chef?.profile_picture?.url),
        price: recipe?.price ?? recipe?.estimated_cost ?? 0,
        status: recipe?.status,
        estimated_cost: recipe?.estimated_cost ?? recipe?.price ?? 0,
        duration_seconds: Number(recipe?.duration_seconds ?? 0) || undefined,
        servings: Number(recipe?.servings ?? 0) || undefined,
        is_quick_recipe: Boolean(recipe?.is_quick_recipe),
        rating: Number(recipe?.rating ?? 0),
        likes_count: Number(recipe?.likes_count ?? 0),
        dislikes_count: Number(recipe?.dislikes_count ?? 0),
        media: {
            video_url: videoUrl || undefined,
            cover_image_url: coverImageUrl || undefined,
        },
        ingredients: normalizeIngredients(recipe?.ingredients),
        instructions: normalizeInstructions(recipe?.instructions),
    };
};

export const recipeService = {
    listRecipes: async (params: ListRecipesParams = {}): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/recipes', { params });
            return {
                data: extractArray(response.data).map(normalizeRecipe),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    listRecommendedRecipes: async (): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/recipes/recommended');
            return {
                data: extractArray(response.data).map(normalizeRecipe),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List Recommended Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    listQuickRecipes: async (): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/recipes/quick');
            return {
                data: extractArray(response.data).map(normalizeRecipe),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List Quick Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getRecipeById: async (id: string): Promise<{ data: Recipe }> => {
        try {
            const response = await api.get(`/recipes/${id}`);
            const payload = response.data?.data || response.data;
            return { data: normalizeRecipe(payload) };
        } catch (error: any) {
            console.error(`Get Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    createRecipe: async (formData: FormData): Promise<{ data: Recipe }> => {
        try {
            const response = await api.post('/chef/recipes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return { data: normalizeRecipe(response.data?.data || response.data) };
        } catch (error: any) {
            console.error('Create Recipe Error:', error.response?.data || error.message);
            throw error;
        }
    },

    updateRecipe: async (id: string, formData: FormData): Promise<{ data: Recipe }> => {
        try {
            const response = await api.patch(`/chef/recipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return { data: normalizeRecipe(response.data?.data || response.data) };
        } catch (error: any) {
            console.error(`Update Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    submitRecipe: async (id: string): Promise<{ code?: string; message?: string }> => {
        try {
            const response = await api.post(`/chef/recipes/${id}/submit`);
            return response.data;
        } catch (error: any) {
            console.error(`Submit Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    deleteRecipe: async (id: string): Promise<void> => {
        try {
            await api.delete(`/chef/recipes/${id}`);
        } catch (error: any) {
            console.error(`Delete Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    listMyRecipes: async (status?: string, q?: string): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/chef/recipes', { params: { status, q } });
            return {
                data: extractArray(response.data).map(normalizeRecipe),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List My Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getMyRecipeById: async (id: string): Promise<{ data: Recipe }> => {
        try {
            const response = await api.get(`/chef/recipes/${id}`);
            return { data: normalizeRecipe(response.data?.data || response.data) };
        } catch (error: any) {
            console.error(`Get My Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    listBookmarkedRecipes: async (): Promise<ListRecipesResponse> => {
        try {
            const response = await api.get('/recipes/bookmarks');
            return {
                data: extractArray(response.data).map(normalizeRecipe),
                meta: extractMeta(response.data),
            };
        } catch (error: any) {
            console.error('List Bookmarked Recipes Error:', error.response?.data || error.message);
            throw error;
        }
    },

    bookmarkRecipe: async (id: string): Promise<{ code?: string; message?: string }> => {
        try {
            const response = await api.post(`/recipes/${id}/bookmark`);
            return response.data;
        } catch (error: any) {
            console.error(`Bookmark Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    unbookmarkRecipe: async (id: string): Promise<{ code?: string; message?: string }> => {
        try {
            const response = await api.delete(`/recipes/${id}/bookmark`);
            return response.data;
        } catch (error: any) {
            console.error(`Unbookmark Recipe (${id}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    addIngredientsToCart: async (
        recipeId: string,
        ingredientIds: string[],
        quantityMultiplier = 1
    ): Promise<{ code?: string; message?: string }> => {
        try {
            const response = await api.post(`/recipes/${recipeId}/ingredients/add-to-cart`, {
                ingredient_ids: ingredientIds,
                quantity_multiplier: quantityMultiplier,
            });
            return response.data;
        } catch (error: any) {
            console.error(`Add Recipe Ingredients To Cart (${recipeId}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    likeRecipe: async (id: string): Promise<void> => {
        await recipeService.bookmarkRecipe(id);
    },

    dislikeRecipe: async (id: string): Promise<void> => {
        await recipeService.unbookmarkRecipe(id);
    },

    rateRecipe: async (_id: string, _rating: number): Promise<void> => {
        return;
    },
};
