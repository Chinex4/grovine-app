import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Share } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Copy } from 'lucide-react-native';

const REFERRAL_CODE = "CD - DAVID23W";

export const ReferralsScreen = ({ navigation }: any) => {
    const onShare = async () => {
        try {
            await Share.share({
                message: `Join Grovine and use my referral code ${REFERRAL_CODE} to get a discount on your first order!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Referrals</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    {/* Hero Card */}
                    <View className="relative bg-[#4CAF50] rounded-[24px] overflow-hidden h-48 items-center justify-center mb-10">
                        {/* Background abstract lines would usually be svgs or separate images, using the generated hero image */}
                        <Image
                            source={require('../../assets/images/gift_box.png')}
                            className="w-full h-full absolute"
                            resizeMode="cover"
                        />

                        <View className="bg-white/90 px-4 py-2.5 rounded-lg flex-row items-center absolute bottom-6">
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px] mr-3">{REFERRAL_CODE}</Text>
                            <View className="flex-row items-center space-x-2">
                                <TouchableOpacity onPress={() => { }}>
                                    <Copy size={14} color="#4CAF50" />
                                </TouchableOpacity>
                                <View className="w-[1px] h-3 bg-gray-200" />
                                <TouchableOpacity onPress={onShare}>
                                    <Ionicons name="share-social-outline" size={16} color="#4CAF50" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Invite Section */}
                    <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-6">Invite a friend and get</Text>

                    <View className="mb-10">
                        <View className="flex-row">
                            <View className="items-center mr-4">
                                <View className="w-5 h-5 rounded-full bg-[#4CAF50]/20 items-center justify-center border border-[#4CAF50]/30">
                                    <View className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                                </View>
                                <View className="w-[1px] flex-1 bg-[#4CAF50]/20 min-h-[40px]" />
                            </View>
                            <View className="pt-0.5 pb-6">
                                <Text className="text-[#424242] font-satoshi font-bold text-[15px]">NGN 500</Text>
                                <Text className="text-[#9E9E9E] font-satoshi text-[12px] mt-0.5">On their first order</Text>
                            </View>
                        </View>

                        <View className="flex-row">
                            <View className="items-center mr-4">
                                <View className="w-5 h-5 rounded-full bg-[#4CAF50]/20 items-center justify-center border border-[#4CAF50]/30">
                                    <View className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                                </View>
                            </View>
                            <View className="pt-0.5">
                                <Text className="text-[#424242] font-satoshi font-bold text-[15px]">NGN 500</Text>
                                <Text className="text-[#9E9E9E] font-satoshi text-[12px] mt-0.5">On their second order</Text>
                            </View>
                        </View>
                    </View>

                    {/* Friend Gets Section */}
                    <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-6">Your friend gets</Text>

                    <View className="flex-row mb-10">
                        <View className="items-center mr-4">
                            <View className="w-5 h-5 rounded-full bg-[#4CAF50]/20 items-center justify-center border border-[#4CAF50]/30">
                                <View className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                            </View>
                        </View>
                        <View className="pt-0.5">
                            <Text className="text-[#424242] font-satoshi font-bold text-[15px]">NGN 500 discount</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mt-0.5">On their first order</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
