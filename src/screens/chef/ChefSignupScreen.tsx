import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chefService, ChefNiche } from '../../utils/chefService';
import Toast from 'react-native-toast-message';

export const ChefSignupScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();
    const [chefName, setChefName] = useState('');
    const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const { data: nichesResponse, isLoading } = useQuery({
        queryKey: ['chef-niches'],
        queryFn: chefService.listNiches,
    });

    const registerMutation = useMutation({
        mutationFn: (params: { name: string; niches: string[] }) => chefService.registerChef(params),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            setSuccessModalVisible(true);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.response?.data?.message || 'Could not create chef account',
            });
        },
    });

    const niches = nichesResponse?.data || [];

    const toggleNiche = (nicheId: string) => {
        if (selectedNiches.includes(nicheId)) {
            setSelectedNiches(selectedNiches.filter(n => n !== nicheId));
        } else {
            setSelectedNiches([...selectedNiches, nicheId]);
        }
    };

    const handleCreateAccount = () => {
        if (!chefName.trim()) {
            Toast.show({ type: 'error', text1: 'Professional name is required' });
            return;
        }
        if (selectedNiches.length === 0) {
            Toast.show({ type: 'error', text1: 'Please select at least one niche' });
            return;
        }
        registerMutation.mutate({ name: chefName, niches: selectedNiches });
    };

    const handleGoToProfile = () => {
        setSuccessModalVisible(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Profile' } }],
        });
    };

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1 px-6">
                <View className="pt-10 pb-6">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full mb-6">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>

                    <Text className="text-[28px] font-satoshi font-bold text-[#424242] leading-[34px]">
                        Create Your Chef{"\n"}Account.
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        <View className="space-y-4">
                            <View className="h-14 bg-white border border-gray-100 rounded-2xl px-4 justify-center mb-4">
                                <TextInput
                                    placeholder="Enter Chef Name"
                                    value={chefName}
                                    onChangeText={setChefName}
                                    className="font-satoshi text-[14px]"
                                    placeholderTextColor="#9E9E9E"
                                />
                            </View>

                            <TouchableOpacity className="h-14 bg-white border border-gray-100 rounded-2xl px-4 flex-row items-center justify-between">
                                <Text className="text-[#9E9E9E] font-satoshi text-[14px]">
                                    {selectedNiches.length > 0 ? `${selectedNiches.length} Niches Selected` : 'Select Niches'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#9E9E9E" />
                            </TouchableOpacity>

                            <View className="flex-row flex-wrap mt-4">
                                {niches.map((niche: ChefNiche) => (
                                    <TouchableOpacity
                                        key={niche.id}
                                        onPress={() => toggleNiche(niche.id)}
                                        className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${selectedNiches.includes(niche.id) ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-gray-100'}`}
                                    >
                                        <Text className={`font-satoshi font-bold text-[12px] ${selectedNiches.includes(niche.id) ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                            {niche.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View className="h-32" />
                    </ScrollView>
                )}

                <View className="absolute bottom-10 left-6 right-6">
                    <TouchableOpacity
                        onPress={handleCreateAccount}
                        disabled={registerMutation.isPending}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        {registerMutation.isPending ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-satoshi font-bold text-[16px]">Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={successModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSuccessModalVisible(false)}
            >
                <View className="flex-1 bg-black/45 items-center justify-center px-8">
                    <View className="bg-white rounded-2xl w-full p-6 items-center">
                        <Ionicons name="checkmark-circle" size={56} color="#4CAF50" />
                        <Text className="font-satoshi font-bold text-[18px] text-[#424242] mt-4 mb-2">
                            You Are Now a Chef
                        </Text>
                        <Text className="font-satoshi text-[13px] text-[#9E9E9E] text-center mb-5">
                            Your chef profile has been created successfully.
                        </Text>
                        <TouchableOpacity
                            onPress={handleGoToProfile}
                            className="w-full h-12 rounded-xl bg-[#4CAF50] items-center justify-center"
                        >
                            <Text className="font-satoshi font-bold text-[14px] text-white">Go To Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};
