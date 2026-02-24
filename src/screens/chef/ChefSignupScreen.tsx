import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import { chefService } from '../../utils/chefService';
import Toast from 'react-native-toast-message';

export const ChefSignupScreen = ({ navigation }: any) => {
    const [chefName, setChefName] = useState('');
    const [selectedNiches, setSelectedNiches] = useState<string[]>([]);

    const { data: categoriesResponse, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: foodService.fetchCategories,
    });

    const registerMutation = useMutation({
        mutationFn: (params: { name: string; niches: string[] }) => chefService.registerChef(params),
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Chef Account Created!',
                text2: 'Welcome to the Grovine family.',
            });
            navigation.replace('ChefProfile');
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error.response?.data?.message || 'Could not create chef account',
            });
        },
    });

    const categories = categoriesResponse?.data || [];

    const toggleNiche = (niche: string) => {
        if (selectedNiches.includes(niche)) {
            setSelectedNiches(selectedNiches.filter(n => n !== niche));
        } else {
            setSelectedNiches([...selectedNiches, niche]);
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
                                {categories.map(niche => (
                                    <TouchableOpacity
                                        key={niche}
                                        onPress={() => toggleNiche(niche)}
                                        className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${selectedNiches.includes(niche) ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-gray-100'}`}
                                    >
                                        <Text className={`font-satoshi font-bold text-[12px] ${selectedNiches.includes(niche) ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                            {niche}
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
        </ScreenWrapper>
    );
};
