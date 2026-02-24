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

const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

export const LoginScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: { email: '' },
        validationSchema: LoginSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                const data = await authService.signIn(values.email);
                if (data.code === 'VERIFICATION_EMAIL_SENT') {
                    Toast.show({
                        type: 'success',
                        text1: 'Verification Sent',
                        text2: 'Please check your email for the code'
                    });
                    navigation.navigate('VerifyOtp', { email: values.email, type: 'login' });
                }
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
        },
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
