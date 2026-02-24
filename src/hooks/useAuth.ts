import { useMutation } from '@tanstack/react-query';
import { authService } from '../utils/authService';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

export const useAuth = () => {
    const dispatch = useDispatch();

    const signInMutation = useMutation({
        mutationFn: (email: string) => authService.signIn(email),
    });

    const verifyOtpMutation = useMutation({
        mutationFn: ({ email, otp, type }: { email: string; otp: string; type: 'login' | 'signup' }) =>
            authService.verifyOtp(email, otp, type),
        onSuccess: async (data) => {
            if (data.code === 'AUTH_CREDENTIALS') {
                const { access_token, refresh_token, user } = data.data;

                // Decode JWT to get user info if not provided in response data
                let userData: any = user || {};
                try {
                    const decoded: any = jwtDecode(access_token);
                    userData = {
                        ...userData,
                        id: decoded.sub,
                        email: decoded.email || userData.email,
                        fullName: decoded.name || userData.fullName,
                    };
                } catch (e) {
                    console.error('Error decoding JWT:', e);
                }

                // Save tokens securely
                await SecureStore.setItemAsync('access_token', access_token);
                await SecureStore.setItemAsync('refresh_token', refresh_token);

                // Update Redux state
                dispatch(setCredentials({
                    user: userData as any,
                    accessToken: access_token,
                    refreshToken: refresh_token,
                }));
            }
        },
    });

    const resendOtpMutation = useMutation({
        mutationFn: ({ email, type }: { email: string; type: 'login' | 'signup' }) => authService.resendVerification(email, type),
    });

    return {
        signIn: signInMutation.mutateAsync,
        isSigningIn: signInMutation.isPending,
        verifyOtp: verifyOtpMutation.mutateAsync,
        isVerifying: verifyOtpMutation.isPending,
        resendOtp: resendOtpMutation.mutateAsync,
        isResending: resendOtpMutation.isPending,
    };
};
