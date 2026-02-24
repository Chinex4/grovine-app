import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '../../utils/walletService';

const { height } = Dimensions.get('window');

export const WalletPaymentScreen = ({ navigation }: any) => {
    const [pinModalVisible, setPinModalVisible] = useState(false);
    const [pin, setPin] = useState('');

    const { data: walletResponse, isLoading: isWalletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: () => walletService.fetchWallet(),
    });

    const balance = walletResponse?.data?.balance || 0;

    const handleNumberPress = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Wallet</Text>
                    <View className="w-6" />
                </View>

                <ScrollView className="flex-1 px-6 pt-6">
                    {/* Balance Card */}
                    <LinearGradient
                        colors={['#4CAF50', '#66BB6A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-[24px] p-8 mb-10 items-center justify-center relative overflow-hidden"
                    >
                        <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                        <View className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />

                        <Text className="text-white/80 font-satoshi font-bold text-[12px] mb-2">Wallet Balance</Text>
                        {isWalletLoading ? (
                            <ActivityIndicator color="white" className="mb-6" />
                        ) : (
                            <Text className="text-white font-satoshi font-black text-[32px] mb-6">₦{balance.toLocaleString()}</Text>
                        )}

                        <TouchableOpacity className="bg-white px-8 py-2.5 rounded-xl flex-row items-center shadow-sm">
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-[13px] mr-2">Add Money</Text>
                            <Ionicons name="card-outline" size={14} color="#4CAF50" />
                        </TouchableOpacity>
                    </LinearGradient>

                    <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-6">Order Summary</Text>

                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} className="flex-row items-center mb-6 pb-2 border-b border-gray-50">
                            <Image
                                source={require('../../assets/images/red_grapes_basket.jpg')}
                                className="w-12 h-12 rounded-lg mr-4"
                            />
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between mb-0.5">
                                    <View>
                                        <Text className="text-[14px] font-satoshi font-bold text-[#424242]">Grape</Text>
                                        <Text className="text-[10px] font-satoshi text-[#9E9E9E]">1 items - NGN 5,500</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <TouchableOpacity className="bg-[#4CAF50]/10 p-1.5 rounded-lg">
                                            <Ionicons name="cloud-upload-outline" size={14} color="#4CAF50" />
                                        </TouchableOpacity>
                                        <TouchableOpacity className="bg-red-50 p-1.5 rounded-lg ml-2">
                                            <Ionicons name="trash-outline" size={14} color="#F44336" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                    <View className="h-40" />
                </ScrollView>

                {/* Sticky Footer */}
                <View className="px-6 py-6 border-t border-[#EEEEEE] absolute bottom-0 w-full bg-[#F7F7F7]">
                    <TouchableOpacity
                        onPress={() => setPinModalVisible(true)}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Pay 19,500</Text>
                    </TouchableOpacity>
                </View>

                {/* PIN Modal */}
                <Modal
                    visible={pinModalVisible}
                    transparent
                    animationType="slide"
                >
                    <View className="flex-1 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-[40px] px-6 pt-10 pb-12">
                            <View className="items-center mb-8">
                                <TouchableOpacity
                                    onPress={() => setPinModalVisible(false)}
                                    className="absolute right-0 top-[-20px]"
                                >
                                    <Ionicons name="close-circle-outline" size={32} color="#E0E0E0" />
                                </TouchableOpacity>
                                <Text className="text-[18px] font-satoshi font-bold text-[#424242] mb-8">Enter Pin</Text>

                                <View className="flex-row justify-center space-x-4">
                                    {[0, 1, 2, 3].map((i) => (
                                        <View key={i} className={`w-14 h-14 bg-gray-50 border ${pin.length > i ? 'border-[#4CAF50]' : 'border-gray-100'} rounded-xl items-center justify-center`}>
                                            {pin.length > i && <View className="w-3 h-3 rounded-full bg-[#424242]" />}
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Number Pad */}
                            <View className="flex-row flex-wrap justify-between">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '+*#', '0'].map((val, i) => (
                                    <TouchableOpacity
                                        key={val}
                                        onPress={() => val !== '+*#' && handleNumberPress(val)}
                                        className={`w-[30%] h-16 items-center justify-center mb-4 rounded-xl ${val === '' ? 'opacity-0' : 'bg-white'}`}
                                    >
                                        <Text className="text-[20px] font-satoshi font-bold text-[#424242]">{val}</Text>
                                        {val === '2' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">ABC</Text>}
                                        {val === '3' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">DEF</Text>}
                                        {val === '4' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">GHI</Text>}
                                        {val === '5' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">JKL</Text>}
                                        {val === '6' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">MNO</Text>}
                                        {val === '7' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">PQRS</Text>}
                                        {val === '8' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">TUV</Text>}
                                        {val === '9' && <Text className="text-[8px] font-satoshi text-[#9E9E9E]">WXYZ</Text>}
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    className="w-[30%] h-16 items-center justify-center mb-4 rounded-xl bg-white"
                                >
                                    <Ionicons name="backspace-outline" size={24} color="#424242" />
                                </TouchableOpacity>
                            </View>

                            {pin.length === 4 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setPinModalVisible(false);
                                        navigation.navigate('Main');
                                    }}
                                    className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center mt-4"
                                >
                                    <Text className="text-white font-satoshi font-bold text-[16px]">Verify</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </ScreenWrapper>
    );
};
