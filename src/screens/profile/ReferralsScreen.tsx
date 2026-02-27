import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Share, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Copy } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { referralService } from '../../utils/referralService';
import Toast from 'react-native-toast-message';

const formatMoney = (currency: string, value: string | number) => {
    const amount = Number(value ?? 0);
    const formatted = Number.isNaN(amount)
        ? '0.00'
        : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency} ${formatted}`;
};

export const ReferralsScreen = ({ navigation }: any) => {
    const { data: referralResponse, isLoading, isError, refetch } = useQuery({
        queryKey: ['referrals'],
        queryFn: referralService.getReferrals,
    });

    const referralData = referralResponse?.data;
    const referralCode = referralData?.referral_code || 'N/A';
    const currency = referralData?.currency || 'NGN';
    const rewardRules = referralData?.reward_rules;
    const stats = referralData?.stats;
    const referredUsers = referralData?.referred_users || [];

    const onShare = async () => {
        try {
            await Share.share({
                message: `Join Grovine and use my referral code ${referralCode} to get a discount on your first order!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const onCopyCode = () => {
        Toast.show({
            type: 'info',
            text1: 'Referral code',
            text2: referralCode,
        });
    };

    if (isLoading) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    if (isError) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 px-6 items-center justify-center">
                    <Text className="font-satoshi text-[#424242] text-[15px] text-center mb-4">
                        Failed to load referrals
                    </Text>
                    <TouchableOpacity
                        onPress={() => refetch()}
                        className="bg-[#4CAF50] px-5 py-3 rounded-xl"
                    >
                        <Text className="text-white font-satoshi font-bold">Retry</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

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
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px] mr-3">{referralCode}</Text>
                            <View className="flex-row items-center space-x-2">
                                <TouchableOpacity onPress={onCopyCode}>
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
                                <Text className="text-[#424242] font-satoshi font-bold text-[15px]">
                                    {formatMoney(currency, rewardRules?.referrer_first_order_reward ?? '0.00')}
                                </Text>
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
                                <Text className="text-[#424242] font-satoshi font-bold text-[15px]">
                                    {formatMoney(currency, rewardRules?.referrer_second_order_reward ?? '0.00')}
                                </Text>
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
                            <Text className="text-[#424242] font-satoshi font-bold text-[15px]">
                                {formatMoney(currency, rewardRules?.referred_first_order_reward ?? '0.00')} discount
                            </Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mt-0.5">On their first order</Text>
                        </View>
                    </View>

                    <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-4">Stats</Text>
                    <View className="bg-gray-50 rounded-2xl p-4 mb-10">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">Total referrals</Text>
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px]">{stats?.total_referrals ?? 0}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">First-order conversions</Text>
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px]">{stats?.first_order_conversions ?? 0}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">Second-order conversions</Text>
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px]">{stats?.second_order_conversions ?? 0}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">Pending referrals</Text>
                            <Text className="text-[#424242] font-satoshi font-bold text-[12px]">{stats?.pending_referrals ?? 0}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">Total bonus earned</Text>
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">
                                {formatMoney(currency, stats?.total_referrer_bonus_earned ?? '0.00')}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-3">Referred users</Text>
                    {referredUsers.length === 0 ? (
                        <View className="mb-10 bg-gray-50 rounded-2xl p-4">
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">
                                You have not referred any users yet.
                            </Text>
                        </View>
                    ) : (
                        <View className="mb-10 bg-gray-50 rounded-2xl p-4">
                            {referredUsers.map((user, index) => (
                                <View
                                    key={user.id || `${user.email || 'user'}-${index}`}
                                    className={`py-2 ${index !== referredUsers.length - 1 ? 'border-b border-gray-200' : ''}`}
                                >
                                    <Text className="text-[#424242] font-satoshi font-bold text-[12px]">
                                        {user.name || user.email || 'Referred User'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
