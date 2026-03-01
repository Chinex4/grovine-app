import api from './api';

export interface Chef {
    id: string;
    name: string;
    niches: string[];
    profile_picture: {
        public_id?: string;
        url: string;
    } | null;
    rating: number;
    likes: number;
    dislikes: number;
    is_verified?: boolean;
    is_banned?: boolean;
    user_id?: string;
    username?: string;
    [key: string]: any;
}

export interface ChefNiche {
    id: string;
    name: string;
    description?: string;
    [key: string]: any;
}

export interface RegisterChefParams {
    name: string;
    niches: string[];
}

export interface UpdateChefParams {
    name?: string;
    username?: string;
    phone?: string;
    email?: string;
    profile_picture?: any;
}

export interface ListChefsParams {
    page?: number;
    per_page?: number;
}

export interface ListChefsResponse {
    code?: string;
    data: {
        data: Chef[];
        meta: {
            page?: number;
            per_page?: number;
            total?: number;
            [key: string]: any;
        };
    };
}

const extractArray = <T = any>(payload: any): T[] => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    return [];
};

const normalizeChef = (payload: any): Chef => {
    const profilePicture = payload?.profile_picture || payload?.avatar || null;
    const niches = Array.isArray(payload?.niches)
        ? payload.niches.map((niche: any) => (typeof niche === 'string' ? niche : niche?.name)).filter(Boolean)
        : [];

    return {
        ...payload,
        id: String(payload?.id ?? payload?.chef_id ?? payload?.user_id ?? ''),
        name: payload?.name ?? payload?.chef_name ?? payload?.full_name ?? '',
        niches,
        profile_picture: profilePicture
            ? {
                public_id: profilePicture?.public_id,
                url: profilePicture?.url ?? '',
            }
            : null,
        rating: Number(payload?.rating ?? 0),
        likes: Number(payload?.likes ?? payload?.likes_count ?? 0),
        dislikes: Number(payload?.dislikes ?? payload?.dislikes_count ?? 0),
        username: payload?.username,
        user_id: payload?.user_id,
    };
};

export const chefService = {
    listNiches: async (): Promise<{ data: ChefNiche[] }> => {
        try {
            const response = await api.get('/niches');
            const niches = extractArray(response.data)
                .map((niche: any) => ({
                    ...niche,
                    id: String(niche?.id ?? ''),
                    name: String(niche?.name ?? ''),
                    sort_order: Number(niche?.sort_order ?? 0),
                }))
                .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            return { data: niches };
        } catch (error: any) {
            console.error('List Niches Error:', error.response?.data || error.message);
            throw error;
        }
    },

    registerChef: async (params: RegisterChefParams): Promise<{ code?: string; data: Chef }> => {
        try {
            const response = await api.post('/chef/become', {
                chef_name: params.name,
                chef_niche_ids: params.niches,
            });
            return {
                code: response.data?.code,
                data: normalizeChef(response.data?.data || response.data),
            };
        } catch (error: any) {
            console.error('Register Chef Error:', error.response?.data || error.message);
            throw error;
        }
    },

    listChefs: async (_params?: ListChefsParams): Promise<ListChefsResponse> => {
        return {
            code: 'NOT_IMPLEMENTED',
            data: { data: [], meta: {} },
        };
    },

    getOwnProfile: async (): Promise<{ code?: string; data: Chef }> => {
        try {
            const response = await api.get('/user/me');
            const payload = response.data?.data || response.data || {};
            return {
                code: response.data?.code,
                data: normalizeChef(payload?.chef || payload),
            };
        } catch (error: any) {
            console.error('Get Own Chef Profile Error:', error.response?.data || error.message);
            throw error;
        }
    },

    updateProfile: async (params: UpdateChefParams): Promise<{ code?: string; data: Chef }> => {
        try {
            if (params.profile_picture) {
                const pictureForm = new FormData();
                pictureForm.append('profile_picture', params.profile_picture);
                await api.post('/user/profile-picture', pictureForm, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            const response = await api.patch('/user/me', {
                name: params.name,
                username: params.username,
                phone: params.phone,
                email: params.email,
            });

            return {
                code: response.data?.code,
                data: normalizeChef(response.data?.data || response.data),
            };
        } catch (error: any) {
            console.error('Update Chef Profile Error:', error.response?.data || error.message);
            throw error;
        }
    },

    getChefById: async (username: string): Promise<{ code?: string; data: Chef }> => {
        try {
            const response = await api.get(`/chefs/${username}`);
            return {
                code: response.data?.code,
                data: normalizeChef(response.data?.data || response.data),
            };
        } catch (error: any) {
            console.error(`Get Chef (${username}) Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    likeChef: async (_id: string): Promise<{ code: string }> => ({ code: 'NOT_SUPPORTED' }),
    dislikeChef: async (_id: string): Promise<{ code: string }> => ({ code: 'NOT_SUPPORTED' }),
    rateChef: async (_id: string, _rating: number): Promise<{ code: string }> => ({ code: 'NOT_SUPPORTED' }),
};
