import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const LEGAL_ITEMS = [
    {
        title: 'Terms of Use',
        summary: 'Rules and terms for using Grovine services and platform features.',
    },
    {
        title: 'Privacy Policy',
        summary: 'How we collect, use, and protect your personal information.',
    },
    {
        title: 'Refund Policy',
        summary: 'Eligibility, timelines, and process for refunds and cancellations.',
    },
];

export const LegalScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Legal</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    {LEGAL_ITEMS.map((item, index) => (
                        <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                            <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-2">{item.title}</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] leading-[18px]">{item.summary}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
