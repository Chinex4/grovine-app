import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
    {
        question: 'How do I place an order?',
        answer: 'Add items to cart, proceed to checkout, choose payment method, and confirm your order.',
    },
    {
        question: 'How do referral rewards work?',
        answer: 'You and your referred user earn rewards based on configured first and second order rules.',
    },
    {
        question: 'How do I become a chef?',
        answer: 'Open your profile and tap "Create A Chef Account" to begin onboarding.',
    },
];

export const FaqsScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">FAQs</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    {FAQS.map((faq, index) => (
                        <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                            <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-2">{faq.question}</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] leading-[18px]">{faq.answer}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
