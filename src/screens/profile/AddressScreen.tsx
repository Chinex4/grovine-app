import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

export const AddressScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Address</Text>
                    <View className="w-8" />
                </View>

                <View className="px-6 pt-8 flex-1">
                    <TouchableOpacity className="bg-gray-100 rounded-2xl px-4 py-4 mb-4 flex-row items-center justify-between">
                        <View>
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-1">Set New Address</Text>
                            <Text className="text-[14px] font-satoshi text-[#9E9E9E]">Guards Park, Lagos</Text>
                        </View>
                        <Ionicons name="pencil-outline" size={18} color="#BDBDBD" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 py-6 bg-white border-t border-gray-50">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
