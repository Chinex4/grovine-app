import api from './api';

export interface PreferencesPayload {
    foods?: string[];
    regions?: string[];
    favorite_food_ids?: string[];
    cuisine_region_ids?: string[];
}

export const onboardingService = {
    setPreferences: async (payload: PreferencesPayload) => {
        try {
            const response = await api.post('/onboarding/preferences', {
                favorite_food_ids: payload.favorite_food_ids ?? payload.foods ?? [],
                cuisine_region_ids: payload.cuisine_region_ids ?? payload.regions ?? [],
            });
            return response.data;
        } catch (error: any) {
            console.error('Set Preferences API Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
