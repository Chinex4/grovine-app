import api from './api';

export interface AuthActionResponse {
    code: string;
    message?: string;
    data?: Record<string, any>;
}

export interface OtpChallengeData {
    otp_expires_at?: string;
    otp_length?: number;
    otp_delivery_channel?: string;
    uses_test_otp?: boolean;
}

export interface SignupPayload {
    name: string;
    email: string;
    phone: string;
    referral_code?: string;
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
    signup: async (payload: SignupPayload): Promise<AuthActionResponse> => {
        try {
            const response = await api.post('/auth/signup', payload);
            return response.data;
        } catch (error: any) {
            console.error('Signup API Error:', error.response?.data || error.message);
            throw error;
        }
    },

    signIn: async (email: string): Promise<AuthActionResponse & { data?: OtpChallengeData }> => {
        try {
            const response = await api.post('/auth/login', { email });
            return response.data;
        } catch (error: any) {
            console.error('Sign-in API Error:', error.response?.data || error.message);
            throw error;
        }
    },

    verifyOtp: async (email: string, otp: string, type: 'login' | 'signup' = 'login'): Promise<VerifyOtpResponse> => {
        try {
            const endpoint = type === 'login' ? '/auth/verify-login-otp' : '/auth/verify-signup-otp';
            const response = await api.post(endpoint, { email, otp });
            return response.data;
        } catch (error: any) {
            console.error('OTP Verification API Error:', error.response?.data || error.message);
            throw error;
        }
    },

    resendVerification: async (
        email: string,
        type: 'login' | 'signup' = 'signup'
    ): Promise<AuthActionResponse & { data?: OtpChallengeData }> => {
        try {
            const response = await api.post('/auth/resend-otp', { email, purpose: type });
            return response.data;
        } catch (error: any) {
            console.error('Resend OTP API Error:', error.response?.data || error.message);
            throw error;
        }
    },
};
