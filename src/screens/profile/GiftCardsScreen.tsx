import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const GIFT_CARD_DENOMINATIONS = ['NGN 1,000', 'NGN 2,500', 'NGN 5,000', 'NGN 10,000'];

export const GiftCardsScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Gift Cards</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    <View className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-2xl p-4 mb-6">
                        <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-2">Send a Gift Card</Text>
                        <Text className="text-[#9E9E9E] font-satoshi text-[12px]">
                            Surprise friends and family with Grovine credit.
                        </Text>
                    </View>

                    <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-3">Choose Amount</Text>
                    <View className="flex-row flex-wrap mb-8">
                        {GIFT_CARD_DENOMINATIONS.map((item) => (
                            <View key={item} className="bg-gray-100 rounded-xl px-4 py-3 mr-2 mb-2">
                                <Text className="text-[#424242] font-satoshi font-bold text-[12px]">{item}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="bg-gray-50 rounded-2xl p-4 mb-8">
                        <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-1">Coming Soon</Text>
                        <Text className="text-[#9E9E9E] font-satoshi text-[12px]">
                            Gift card purchase and redemption will be available in a future update.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
