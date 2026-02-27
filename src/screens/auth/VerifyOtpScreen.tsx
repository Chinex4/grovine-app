import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { useAuth } from '../../hooks/useAuth';
import Toast from 'react-native-toast-message';

export const VerifyOtpScreen = ({ navigation, route }: any) => {
    const { type = 'signup', email = '' } = route.params || {};
    const { verifyOtp, isVerifying, resendOtp, isResending } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value && index < 4) {
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
            await resendOtp({ email, type });
            setTimer(30);
            Toast.show({
                type: 'success',
                text1: 'OTP Resent',
                text2: 'Please check your email for the code'
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Failed to resend OTP',
                text2: error.response?.data?.message || 'Please try again later'
            });
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < 5) return;

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
                            Kindly input the 5 digits code{"\n"}sent your email address
                        </Text>
                    </View>

                    <View className="flex-1">
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
                            <Text className="text-[#9E9E9E] font-satoshi mr-1">Didn't get code?</Text>
                            <TouchableOpacity
                                disabled={timer > 0 || isResending}
                                onPress={handleResendOtp}
                            >
                                <Text className={`font-satoshi font-bold ${timer > 0 || isResending ? 'text-[#B2E2B4]' : 'text-[#4CAF50]'}`}>
                                    {isResending ? 'Resending...' : 'Resend'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="pb-10 pt-4">
                        <Button
                            title={type === 'login' ? 'Sign In' : (timer > 0 ? `Verify in ${timer}secs` : 'Verify Now')}
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
