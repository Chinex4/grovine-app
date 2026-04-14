import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../utils/authService';
import Toast from 'react-native-toast-message';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { isPlayStoreReviewBuild, PLAY_STORE_REVIEW_CONFIG } from '../../constants/playStoreReview';

const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

export const LoginScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);

    const requestLoginCode = async (email: string) => {
        setLoading(true);
        try {
            const response = await authService.signIn(email);
            const challenge = response.data;
            const usesTestOtp = challenge?.uses_test_otp || challenge?.otp_delivery_channel === 'fixed_test_code';

            Toast.show({
                type: 'success',
                text1: 'Verification Sent',
                text2: usesTestOtp
                    ? 'Use the Play Store reviewer code to continue.'
                    : 'Please check your email for the code',
            });

            navigation.navigate('VerifyOtp', { email, type: 'login', challenge });
        } catch (error: any) {
            console.log('LoginScreen Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Sign-in Failed',
                text2: error.message === 'Network Error'
                    ? 'Network error: Please check your internet connection'
                    : error.response?.data?.message || error.message || 'Could not connect to server'
            });
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: { email: '' },
        validationSchema: LoginSchema,
        onSubmit: async (values) => requestLoginCode(values.email),
    });

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
                    <View className="mt-16 mb-10">
                        <Text className="text-[28px] font-satoshi font-bold text-[#424242] leading-[36px]">
                            Welcome{"\n"}Back!
                        </Text>
                    </View>

                    <View className="flex-1">
                        <Input
                            placeholder="Enter Email Address"
                            value={formik.values.email}
                            onChangeText={formik.handleChange('email')}
                            onBlur={formik.handleBlur('email')}
                            error={formik.touched.email ? formik.errors.email : undefined}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {isPlayStoreReviewBuild ? (
                            <View className="rounded-2xl bg-white px-4 py-4 mt-2">
                                <Text className="text-[#424242] text-sm font-satoshi font-bold mb-1">
                                    Play Store review account
                                </Text>
                                <Text className="text-[#757575] text-sm font-satoshi leading-[20px]">
                                    Reviewer email: {PLAY_STORE_REVIEW_CONFIG.reviewerEmail}
                                </Text>
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="mt-3 self-start rounded-full bg-[#E8F5E9] px-4 py-2"
                                    onPress={() => {
                                        formik.setFieldValue('email', PLAY_STORE_REVIEW_CONFIG.reviewerEmail);
                                        formik.setFieldTouched('email', true, false);
                                        requestLoginCode(PLAY_STORE_REVIEW_CONFIG.reviewerEmail);
                                    }}
                                >
                                    <Text className="text-[#2E7D32] text-sm font-satoshi font-bold">
                                        Use Play Store test account
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>

                    <View className="pb-10 pt-4">
                        <Button
                            title="Send Code"
                            onPress={() => formik.handleSubmit()}
                            loading={loading}
                            className="bg-[#4CAF50] h-12 rounded-lg mb-6"
                        />

                        <View className="flex-row justify-center">
                            <Text className="text-[#9E9E9E] text-sm font-satoshi">Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                <Text className="text-[#4CAF50] font-bold text-sm font-satoshi">Create account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
