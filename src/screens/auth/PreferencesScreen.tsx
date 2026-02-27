import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { onboardingService } from '../../utils/onboardingService';
import { foodService, OptionItem } from '../../utils/foodService';
import Toast from 'react-native-toast-message';

const DEFAULT_COLORS = ['#8D5B2E', '#ABB76C', '#F2994A', '#4CAF50', '#4F4F4F', '#828282'];

export const PreferencesScreen = ({ navigation }: any) => {
    const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

    const { data: foodsResponse, isLoading: isFoodsLoading } = useQuery({
        queryKey: ['favorite-foods'],
        queryFn: foodService.fetchFavoriteFoodOptions,
    });

    const { data: regionsResponse, isLoading: isRegionsLoading } = useQuery({
        queryKey: ['cuisine-regions'],
        queryFn: foodService.fetchCuisineRegionOptions,
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

    const favoriteFoods = foodsResponse?.data || [];
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
                favorite_food_ids: selectedFoods,
                cuisine_region_ids: selectedCuisines,
            });
        } catch (e) {
            // Error handled by mutation onError
        }
    };

    const toggleTag = (id: string, type: 'food' | 'cuisine') => {
        if (type === 'food') {
            setSelectedFoods(prev =>
                prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
            );
        } else {
            setSelectedCuisines(prev =>
                prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
            );
        }
    };

    const Tag = ({ id, label, color, type }: { id: string, label: string, color: string, type: 'food' | 'cuisine' }) => {
        const isSelected = type === 'food'
            ? selectedFoods.includes(id)
            : selectedCuisines.includes(id);

        return (
            <TouchableOpacity
                onPress={() => toggleTag(id, type)}
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

    const isLoading = isFoodsLoading || isRegionsLoading;

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
                            {favoriteFoods.map((food: OptionItem, idx) => (
                                <Tag
                                    key={`food-${food.id}-${idx}`}
                                    id={food.id}
                                    label={food.name}
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
                            {regions.map((region: OptionItem, idx) => (
                                <Tag
                                    key={`cuisine-${region.id}-${idx}`}
                                    id={region.id}
                                    label={region.name}
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
