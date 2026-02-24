import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SignupSchema = Yup.object().shape({
    name: Yup.string().required('Full name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string()
        .matches(/^[0-9]+$/, 'Phone number must be digits only')
        .min(10, 'Phone number is too short')
        .required('Phone number is required'),
    referral: Yup.string(),
});

export const SignupScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone: '',
            referral: '',
        },
        validationSchema: SignupSchema,
        onSubmit: (values) => {
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                navigation.navigate('VerifyOtp', { email: values.email, type: 'signup' });
            }, 1500);
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
                    <View className="mt-8 mb-8">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 items-center justify-center bg-white rounded-lg mb-8"
                        >
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>

                        <Text className="text-[28px] font-satoshi font-bold text-[#424242] leading-[36px]">
                            Create Your{"\n"}Account.
                        </Text>
                    </View>

                    <View className="flex-1">
                        <Input
                            placeholder="Enter Full Name"
                            value={formik.values.name}
                            onChangeText={formik.handleChange('name')}
                            onBlur={formik.handleBlur('name')}
                            error={formik.touched.name ? formik.errors.name : undefined}
                        />

                        <Input
                            placeholder="Enter Email Address"
                            value={formik.values.email}
                            onChangeText={formik.handleChange('email')}
                            onBlur={formik.handleBlur('email')}
                            error={formik.touched.email ? formik.errors.email : undefined}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Input
                            placeholder="Enter Phone Number"
                            value={formik.values.phone}
                            onChangeText={formik.handleChange('phone')}
                            onBlur={formik.handleBlur('phone')}
                            error={formik.touched.phone ? formik.errors.phone : undefined}
                            keyboardType="phone-pad"
                            isPhone
                        />

                        <Input
                            placeholder="Enter Referral Code"
                            value={formik.values.referral}
                            onChangeText={formik.handleChange('referral')}
                            onBlur={formik.handleBlur('referral')}
                        />
                    </View>

                    <View className="pb-10 pt-4">
                        <Button
                            title="Create Account"
                            onPress={() => formik.handleSubmit()}
                            loading={loading}
                            className="bg-[#4CAF50] h-12 rounded-lg mb-6"
                        />

                        <View className="flex-row justify-center">
                            <Text className="text-[#9E9E9E] text-sm font-satoshi">Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-[#4CAF50] font-bold text-sm font-satoshi">Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
