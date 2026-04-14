import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';
import { isPlayStoreReviewBuild, PLAY_STORE_REVIEW_CONFIG } from '../../constants/playStoreReview';

const DEFAULT_OTP_LENGTH = 5;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 30;

const getSecondsUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) {
        return 0;
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    if (Number.isNaN(expiresAtMs)) {
        return 0;
    }

    return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
};

const parseCooldownSeconds = (message?: string) => {
    if (!message) {
        return 0;
    }

    const match = message.match(/please wait\s+(\d+)\s+seconds?/i);
    return match ? Number(match[1]) : 0;
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

const buildOtpArray = (length: number, code = '') =>
    Array.from({ length }, (_, index) => code[index] || '');

export const VerifyOtpScreen = ({ navigation, route }: any) => {
    const { type = 'signup', email = '', challenge } = route.params || {};
    const { signIn, isSigningIn, verifyOtp, isVerifying, resendOtp, isResending } = useAuth();
    const otpLength = challenge?.otp_length || DEFAULT_OTP_LENGTH;
    const isTestOtpLogin = challenge?.uses_test_otp || challenge?.otp_delivery_channel === 'fixed_test_code';
    const shouldShowReviewerHelper =
        type === 'login' &&
        isTestOtpLogin &&
        isPlayStoreReviewBuild &&
        email.toLowerCase() === PLAY_STORE_REVIEW_CONFIG.reviewerEmail.toLowerCase();
    const [otp, setOtp] = useState(buildOtpArray(otpLength));
    const [expiresIn, setExpiresIn] = useState(getSecondsUntilExpiry(challenge?.otp_expires_at));
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    const applyNextOtpState = (nextLength: number, shouldPrefillReviewerCode = false) => {
        setOtp(
            shouldPrefillReviewerCode
                ? buildOtpArray(nextLength, PLAY_STORE_REVIEW_CONFIG.reviewerOtp)
                : buildOtpArray(nextLength)
        );
    };

    useEffect(() => {
        setOtp(buildOtpArray(otpLength));
    }, [otpLength, email]);

    useEffect(() => {
        setExpiresIn(getSecondsUntilExpiry(challenge?.otp_expires_at));
    }, [challenge?.otp_expires_at]);

    useEffect(() => {
        if (!shouldShowReviewerHelper) {
            return;
        }

        if (PLAY_STORE_REVIEW_CONFIG.reviewerOtp.length >= otpLength) {
            setOtp(buildOtpArray(otpLength, PLAY_STORE_REVIEW_CONFIG.reviewerOtp));
        }
    }, [otpLength, shouldShowReviewerHelper]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (expiresIn > 0) {
            interval = setInterval(() => {
                setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [expiresIn]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < otpLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResendOtp = async () => {
        try {
            const response = type === 'login'
                ? await signIn(email)
                : await resendOtp({ email, type });
            const nextChallenge = response?.data;
            const usesTestOtp = nextChallenge?.uses_test_otp || nextChallenge?.otp_delivery_channel === 'fixed_test_code';
            const nextLength = nextChallenge?.otp_length || otpLength;

            applyNextOtpState(nextLength, shouldShowReviewerHelper && usesTestOtp);
            setExpiresIn(getSecondsUntilExpiry(nextChallenge?.otp_expires_at));
            setResendCooldown(DEFAULT_RESEND_COOLDOWN_SECONDS);
            navigation.setParams({ challenge: nextChallenge || challenge });
            Toast.show({
                type: 'success',
                text1: 'Code Sent',
                text2: usesTestOtp
                    ? 'Use the Play Store reviewer code to continue.'
                    : 'Please check your email for the code'
            });
        } catch (error: any) {
            const message = error.response?.data?.message || 'Please try again later';
            const cooldownSeconds = parseCooldownSeconds(message);
            if (cooldownSeconds > 0) {
                setResendCooldown(cooldownSeconds);
            }

            Toast.show({
                type: 'error',
                text1: 'Failed to send code',
                text2: message
            });
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < otpLength) return;

        if (type === 'login' && expiresIn === 0) {
            try {
                const response = await signIn(email);
                const nextChallenge = response?.data;
                const usesTestOtp = nextChallenge?.uses_test_otp || nextChallenge?.otp_delivery_channel === 'fixed_test_code';
                const nextLength = nextChallenge?.otp_length || otpLength;
                applyNextOtpState(nextLength, shouldShowReviewerHelper && usesTestOtp);
                setExpiresIn(getSecondsUntilExpiry(nextChallenge?.otp_expires_at));
                navigation.setParams({ challenge: nextChallenge || challenge });
                Toast.show({
                    type: 'info',
                    text1: 'Code refreshed',
                    text2: 'Your previous code expired. We requested a new one.'
                });
            } catch (error: any) {
                Toast.show({
                    type: 'error',
                    text1: 'Code expired',
                    text2: error.response?.data?.message || 'Please request a new code.'
                });
            }
            return;
        }

        try {
            const result = await verifyOtp({ email, otp: otpString, type });
            if (result?.data?.access_token) {
                Toast.show({
                    type: 'success',
                    text1: 'Success!',
                    text2: 'You have been signed in successfully.'
                });

                if (type === 'login') {
                    navigation.navigate('Main');
                } else {
                    navigation.navigate('Preferences');
                }
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Verification Failed',
                text2: error.response?.data?.message || 'Invalid or expired OTP'
            });
        }
    };

    return (
        <ScreenWrapper bg="#F7F7F7">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="px-8"
                >
                    <View className="mt-8 mb-8">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 items-center justify-center bg-white rounded-lg mb-8"
                        >
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>

                        <Text className="text-[28px] font-satoshi font-bold text-[#424242] leading-[36px] mb-1">
                            {type === 'login' ? 'Verify Your\nSign In.' : 'Verify Your\nAccount.'}
                        </Text>
                        <Text className="text-[14px] font-satoshi text-[#9E9E9E] leading-[20px]">
                            {shouldShowReviewerHelper
                                ? `Use the fixed ${otpLength}-digit reviewer code below to continue.`
                                : `Kindly input the ${otpLength} digits code sent to ${email}`}
                        </Text>
                    </View>

                    <View className="flex-1">
                        {shouldShowReviewerHelper ? (
                            <View className="rounded-2xl bg-white px-4 py-4 mb-6">
                                <Text className="text-[#424242] text-sm font-satoshi font-bold mb-1">
                                    Play Store reviewer sign-in
                                </Text>
                                <Text className="text-[#757575] text-sm font-satoshi leading-[20px]">
                                    Email: {PLAY_STORE_REVIEW_CONFIG.reviewerEmail}
                                </Text>
                                <Text className="text-[#757575] text-sm font-satoshi leading-[20px]">
                                    Fixed OTP: {PLAY_STORE_REVIEW_CONFIG.reviewerOtp}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="mt-3 self-start rounded-full bg-[#E8F5E9] px-4 py-2"
                                    onPress={() => setOtp(buildOtpArray(otpLength, PLAY_STORE_REVIEW_CONFIG.reviewerOtp))}
                                >
                                    <Text className="text-[#2E7D32] text-sm font-satoshi font-bold">
                                        Fill reviewer code
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        {type === 'login' && challenge?.otp_expires_at ? (
                            <Text className="text-center text-[#757575] font-satoshi mb-6">
                                {expiresIn > 0
                                    ? `Code expires in ${formatTime(expiresIn)}`
                                    : 'Code expired. Request a new one to continue.'}
                            </Text>
                        ) : null}

                        <View className="flex-row justify-between mb-10">
                            {otp.map((digit, index) => (
                                <View
                                    key={index}
                                    className="w-[50px] h-[50px] bg-[#EEEEEE] rounded-xl items-center justify-center"
                                >
                                    <TextInput
                                        ref={(ref) => { inputRefs.current[index] = ref; }}
                                        className="text-[20px] font-satoshi font-bold text-[#424242] text-center w-full h-full"
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        value={digit}
                                        onChangeText={(value) => handleOtpChange(value, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        placeholder="0"
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                            ))}
                        </View>

                        <View className="flex-row justify-center items-center">
                            <Text className="text-[#9E9E9E] font-satoshi mr-1">
                                {shouldShowReviewerHelper ? 'Need a fresh reviewer code?' : "Didn't get code?"}
                            </Text>
                            <TouchableOpacity
                                disabled={resendCooldown > 0 || isResending || isSigningIn}
                                onPress={handleResendOtp}
                            >
                                <Text className={`font-satoshi font-bold ${resendCooldown > 0 || isResending || isSigningIn ? 'text-[#B2E2B4]' : 'text-[#4CAF50]'}`}>
                                    {isResending || isSigningIn
                                        ? 'Sending...'
                                        : resendCooldown > 0
                                            ? `Retry in ${resendCooldown}s`
                                            : type === 'login'
                                                ? 'Request new code'
                                                : 'Resend'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="pb-10 pt-4">
                        <Button
                            title={type === 'login' ? 'Sign In' : 'Verify Now'}
                            onPress={handleVerify}
                            disabled={otp.some(d => !d) || isVerifying}
                            loading={isVerifying}
                            className="bg-[#4CAF50] h-12 rounded-lg"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
