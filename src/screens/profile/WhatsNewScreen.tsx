import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const UPDATES = [
    {
        title: 'Improved Profile',
        description: 'Update your profile details and picture directly from your account.',
    },
    {
        title: 'Referral Insights',
        description: 'Track referral earnings, conversions, and referred users in one place.',
    },
    {
        title: 'Faster Checkout',
        description: 'Cart and checkout requests now use the latest Grovine API endpoints.',
    },
];

export const WhatsNewScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">What's New</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    {UPDATES.map((update, index) => (
                        <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                            <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-2">{update.title}</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] leading-[18px]">{update.description}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
