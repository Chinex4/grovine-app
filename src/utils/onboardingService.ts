import api from './api';

export interface PreferencesPayload {
    foods: string[];
    regions: string[];
}

export const onboardingService = {
    setPreferences: async (payload: PreferencesPayload) => {
        try {
            console.log('Setting preferences:', payload);
            const response = await api.post('/onboarding/preferences', payload);
            console.log('Preferences set response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Set Preferences API Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
