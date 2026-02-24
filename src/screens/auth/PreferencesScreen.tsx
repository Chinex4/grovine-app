import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { onboardingService } from '../../utils/onboardingService';
import { foodService } from '../../utils/foodService';
import Toast from 'react-native-toast-message';

const DEFAULT_COLORS = ['#8D5B2E', '#ABB76C', '#F2994A', '#4CAF50', '#4F4F4F', '#828282'];

export const PreferencesScreen = ({ navigation }: any) => {
    const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: foodService.fetchCategories,
    });

    const { data: regionsResponse, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: foodService.fetchRegions,
    });

    const { mutateAsync: setPreferences, isPending } = useMutation({
        mutationFn: onboardingService.setPreferences,
        onSuccess: () => {
            navigation.navigate('Main');
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to save preferences',
                text2: error.response?.data?.message || 'Something went wrong'
            });
        }
    });

    const categories = categoriesResponse?.data || [];
    const regions = regionsResponse?.data || [];

    const handleGetStarted = async () => {
        if (selectedFoods.length === 0 || selectedCuisines.length === 0) {
            Toast.show({
                type: 'info',
                text1: 'Selection Required',
                text2: 'Please select at least one food and one region'
            });
            return;
        }

        try {
            await setPreferences({
                foods: selectedFoods,
                regions: selectedCuisines
            });
        } catch (e) {
            // Error handled by mutation onError
        }
    };

    const toggleTag = (label: string, type: 'food' | 'cuisine') => {
        if (type === 'food') {
            setSelectedFoods(prev =>
                prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
            );
        } else {
            setSelectedCuisines(prev =>
                prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
            );
        }
    };

    const Tag = ({ label, color, type }: { label: string, color: string, type: 'food' | 'cuisine' }) => {
        const isSelected = type === 'food'
            ? selectedFoods.includes(label)
            : selectedCuisines.includes(label);

        return (
            <TouchableOpacity
                onPress={() => toggleTag(label, type)}
                style={{ backgroundColor: isSelected ? color : `${color}20` }}
                className="px-4 py-2 rounded-lg mr-2 mb-3"
            >
                <Text
                    style={{ color: isSelected ? 'white' : color }}
                    className="font-satoshi font-bold text-sm"
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const isLoading = isCategoriesLoading || isRegionsLoading;

    if (isLoading) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="px-8 pt-8"
                >
                    <View className="mb-6">
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242] mb-1">
                            Set Your Preferences
                        </Text>
                        <Text className="text-[13px] font-satoshi text-[#9E9E9E] leading-[18px]">
                            Pick the foods you love, and we'll recommend recipes and groceries you'll enjoy!
                        </Text>
                    </View>

                    <View className="mb-6">
                        <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-3">
                            Choose Your Favorite Foods
                        </Text>
                        <View className="flex-row flex-wrap">
                            {categories.map((label, idx) => (
                                <Tag
                                    key={`food-${idx}`}
                                    label={label}
                                    color={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                    type="food"
                                />
                            ))}
                        </View>
                    </View>

                    <View className="mb-10">
                        <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-3">
                            Select Your Favorite Cuisine Regions
                        </Text>
                        <View className="flex-row flex-wrap">
                            {regions.map((label, idx) => (
                                <Tag
                                    key={`cuisine-${idx}`}
                                    label={label}
                                    color={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                                    type="cuisine"
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>

                <View className="px-8 pb-8">
                    <Button
                        title="Get Started"
                        onPress={handleGetStarted}
                        loading={isPending}
                        disabled={isPending}
                        className="bg-[#4CAF50] h-12 rounded-lg"
                        icon={<MaterialIcons name="login" size={20} color="white" />}
                        iconPosition="right"
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};
