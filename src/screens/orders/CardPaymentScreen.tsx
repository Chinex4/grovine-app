import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Switch } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

export const CardPaymentScreen = ({ navigation }: any) => {
    const [saveCard, setSaveCard] = useState(true);

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Pay with Card</Text>
                    <View className="w-6" />
                </View>

                <View className="px-6 py-8">
                    <Text className="text-[14px] font-satoshi text-[#9E9E9E] mb-1">Total Amount:</Text>
                    <Text className="text-[32px] font-satoshi font-black text-[#424242] mb-10">₦19,500</Text>

                    <Text className="text-[12px] font-satoshi font-bold text-[#9E9E9E] mb-2">Card number</Text>
                    <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-6">
                        <Image
                            source={require('../../assets/images/mastercard_logo.jpg')}
                            className="w-10 h-6 mr-3"
                            resizeMode="contain"
                        />
                        <TextInput
                            placeholder="**** **** **** ****"
                            className="flex-1 font-satoshi text-[#424242] text-[16px] tracking-widest"
                            placeholderTextColor="#E0E0E0"
                            keyboardType="numeric"
                        />
                    </View>

                    <View className="flex-row mb-6">
                        <View className="flex-1 mr-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#9E9E9E] mb-2">Valid until</Text>
                            <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl justify-center px-4">
                                <TextInput
                                    placeholder="Month / Year"
                                    className="font-satoshi text-[#424242] text-[14px]"
                                    placeholderTextColor="#E0E0E0"
                                />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-[12px] font-satoshi font-bold text-[#9E9E9E] mb-2">CVV</Text>
                            <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl justify-center px-4">
                                <TextInput
                                    placeholder="***"
                                    className="font-satoshi text-[#424242] text-[14px]"
                                    placeholderTextColor="#E0E0E0"
                                    secureTextEntry
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    <Text className="text-[12px] font-satoshi font-bold text-[#9E9E9E] mb-2">Card holder</Text>
                    <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl justify-center px-4 mb-8">
                        <TextInput
                            placeholder="Enter card holder name"
                            className="font-satoshi text-[#424242] text-[14px]"
                            placeholderTextColor="#E0E0E0"
                            autoCapitalize="words"
                        />
                    </View>

                    <View className="flex-row items-center justify-between mb-8">
                        <Text className="text-[14px] font-satoshi text-[#424242]">Save card for payments</Text>
                        <Switch
                            value={saveCard}
                            onValueChange={setSaveCard}
                            trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Footer */}
                <View className="px-6 py-6 border-t border-[#EEEEEE] absolute bottom-0 w-full bg-[#F7F7F7]">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('PaymentOtp')}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Pay 19,500</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
