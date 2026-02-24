import api from './api';

export interface SignInResponse {
    code: string;
    message?: string;
}

export interface VerifyOtpResponse {
    code: string;
    data: {
        access_token: string;
        refresh_token: string;
        user?: {
            email: string;
            fullName?: string;
            [key: string]: any;
        }
    };
}

export const authService = {
    signIn: async (email: string): Promise<SignInResponse> => {
        try {
            console.log('Attempting sign-in for:', email);
            const response = await api.post('/auth/sign-in', { email });
            console.log('Sign-in response data:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Sign-in API Error:', error.response?.data || error.message);
            throw error;
        }
    },
    verifyOtp: async (email: string, otp: string, type: 'login' | 'signup' = 'login'): Promise<VerifyOtpResponse> => {
        try {
            const endpoint = type === 'login' ? '/auth/sign-in/verification' : '/auth/sign-up/verification';
            console.log(`Attempting OTP verification (${type}) for:`, email);
            const response = await api.post(endpoint, { email, otp });
            console.log('OTP verification response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('OTP Verification API Error:', error.response?.data || error.message);
            throw error;
        }
    },
    resendVerification: async (email: string, type: 'login' | 'signup' = 'signup'): Promise<SignInResponse> => {
        try {
            const endpoint = type === 'login' ? '/auth/sign-in/verification/resend' : '/auth/sign-up/verification/resend';
            console.log(`Attempting Resend OTP (${type}) for:`, email);
            const response = await api.post(endpoint, { email });
            console.log('Resend OTP response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Resend OTP API Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
