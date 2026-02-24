import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

export const PaymentOtpScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">OTP Verification</Text>
                    <View className="w-6" />
                </View>

                <View className="px-6 py-10">
                    <Text className="text-[28px] font-satoshi font-black text-[#424242] mb-2">Confirm Payment</Text>
                    <Text className="text-[14px] font-satoshi text-[#9E9E9E] mb-10 leading-[20px]">
                        Kindly input the 5 digits code{"\n"}sent you
                    </Text>

                    <View className="flex-row justify-between mb-10">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <View key={i} className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl items-center justify-center">
                                <Text className="text-[18px] font-satoshi font-bold text-[#424242]">0</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View className="px-6 py-6 absolute bottom-0 w-full">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('WalletPayment')}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Confirm OTP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
