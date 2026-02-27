import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const SUPPORT_EMAIL = 'support@grovine.ng';

export const SupportScreen = ({ navigation }: any) => {
    const openEmail = async () => {
        const url = `mailto:${SUPPORT_EMAIL}`;
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
            Toast.show({ type: 'error', text1: 'No email app available' });
            return;
        }
        await Linking.openURL(url);
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Support</Text>
                    <View className="w-8" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                    <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                        <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-1">Need help?</Text>
                        <Text className="text-[#9E9E9E] font-satoshi text-[12px] mb-3">
                            Reach out to our support team and we will get back to you as soon as possible.
                        </Text>
                        <TouchableOpacity
                            onPress={openEmail}
                            className="bg-[#4CAF50] h-11 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-satoshi font-bold text-[13px]">Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
