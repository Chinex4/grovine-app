import { useMutation } from '@tanstack/react-query';
import { authService } from '../utils/authService';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken } from '../utils/api';

export const useAuth = () => {
    const dispatch = useDispatch();

    const signInMutation = useMutation({
        mutationFn: (email: string) => authService.signIn(email),
    });

    const verifyOtpMutation = useMutation({
        mutationFn: ({ email, otp, type }: { email: string; otp: string; type: 'login' | 'signup' }) =>
            authService.verifyOtp(email, otp, type),
        onSuccess: async (data) => {
            const accessToken = data?.data?.access_token;
            if (accessToken) {
                const refreshToken = data?.data?.refresh_token || '';
                const user = data?.data?.user;

                // Decode JWT to get user info if not provided in response data
                let userData: any = user || {};
                try {
                    const decoded: any = jwtDecode(accessToken);
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
                await SecureStore.setItemAsync('access_token', accessToken);
                if (refreshToken) {
                    await SecureStore.setItemAsync('refresh_token', refreshToken);
                } else {
                    await SecureStore.deleteItemAsync('refresh_token');
                }
                setAccessToken(accessToken);

                // Update Redux state
                dispatch(setCredentials({
                    user: userData as any,
                    accessToken,
                    refreshToken,
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
