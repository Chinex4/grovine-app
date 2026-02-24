import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { LogOut, Trash2, ChevronRight, PenTool } from 'lucide-react-native';

const DETAIL_ITEMS = [
    { label: 'Account name', value: 'David Okafor', icon: 'pencil-outline' },
    { label: 'Phone number', value: '08130111727', icon: 'pencil-outline' },
    { label: 'Email', value: 'davidokafor@gmail.com', icon: 'pencil-outline' },
    { label: 'Date of birth', value: '-', icon: 'calendar-outline' },
];

export const ProfileDetailsScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Profile Details</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-8">
                    {DETAIL_ITEMS.map((item, index) => (
                        <TouchableOpacity key={index} className="bg-gray-100 rounded-2xl px-4 py-4 mb-4 flex-row items-center justify-between">
                            <View>
                                <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-1">{item.label}</Text>
                                <Text className="text-[14px] font-satoshi text-[#9E9E9E]">{item.value}</Text>
                            </View>
                            <Ionicons name={item.icon as any} size={18} color="#BDBDBD" />
                        </TouchableOpacity>
                    ))}

                    <View className="mt-6">
                        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
                            <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                <LogOut size={18} color="#424242" />
                            </View>
                            <Text className="flex-1 font-satoshi font-bold text-[#424242] text-[15px]">Sign out</Text>
                            <ChevronRight size={18} color="#BDBDBD" />
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-100">
                            <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                <Trash2 size={18} color="#F44336" />
                            </View>
                            <Text className="flex-1 font-satoshi font-bold text-[#F44336] text-[15px]">Delete account</Text>
                            <ChevronRight size={18} color="#BDBDBD" />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

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
