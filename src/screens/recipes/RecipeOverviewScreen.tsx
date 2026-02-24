import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Heart, Share2, Bookmark } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../../utils/recipeService';
import Toast from 'react-native-toast-message';

export const RecipeOverviewScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const queryClient = useQueryClient();

    const { data: recipeResponse, isLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const recipe = recipeResponse?.data;

    const likeMutation = useMutation({
        mutationFn: () => recipeService.likeRecipe(recipeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            Toast.show({ type: 'success', text1: 'Recipe liked' });
        },
    });

    // We'll use the same list as related for now, or fetch another set if the API supports it
    const { data: relatedResponse } = useQuery({
        queryKey: ['related-recipes'],
        queryFn: () => recipeService.listRecipes({ per_page: 4 }),
    });

    const relatedRecipes = relatedResponse?.data?.filter(r => r.id !== recipeId) || [];

    if (isLoading) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    if (!recipe) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <Text>Recipe not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-[#4CAF50] px-4 py-2 rounded-lg">
                        <Text className="text-white">Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Recipe Detail</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* Video / Main Image Section */}
                    <View className="px-6 pt-6">
                        <View className="relative">
                            <Image
                                source={recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : require('../../assets/images/egusi.png')}
                                className="w-full h-52 rounded-[24px]"
                                resizeMode="cover"
                            />
                            <View className="absolute top-4 right-4 bg-white/20 p-2 rounded-full">
                                <Bookmark size={18} color="white" />
                            </View>
                            <View className="absolute bottom-4 right-4 bg-black/40 px-2 py-0.5 rounded-md">
                                <Text className="text-white text-[10px] font-bold">06:24</Text>
                            </View>
                        </View>
                    </View>

                    {/* Content Section */}
                    <View className="px-6 pt-6">
                        <Text className="text-[20px] font-satoshi font-bold text-[#424242] mb-2">{recipe.title}</Text>
                        <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px] mb-6">
                            {recipe.description}
                        </Text>

                        {/* Chef and Stats */}
                        <View className="flex-row items-center justify-between mb-8">
                            <View className="flex-row items-center">
                                <Image
                                    source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : require('../../assets/images/3d_avatar_3.png')}
                                    className="w-8 h-8 rounded-full mr-3"
                                />
                                <View>
                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">{recipe.chef_name || 'Chef'}</Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="star" size={10} color="#FFA000" />
                                        <Text className="text-[10px] font-satoshi text-[#9E9E9E] ml-1">{recipe.rating} Rating</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="flex-row items-center space-x-3">
                                <TouchableOpacity
                                    onPress={() => likeMutation.mutate()}
                                    className="bg-gray-50 border border-gray-100 flex-row items-center px-3 py-1.5 rounded-lg"
                                >
                                    <Heart size={14} color="#424242" fill={recipe.likes_count > 0 ? "#424242" : "transparent"} />
                                    <Text className="text-[10px] font-satoshi font-bold text-[#424242] ml-2">{recipe.likes_count.toLocaleString()} Likes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity className="bg-gray-50 border border-gray-100 p-2 rounded-lg">
                                    <Share2 size={16} color="#424242" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Related Recipes */}
                        {relatedRecipes.length > 0 && (
                            <>
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-[#424242] font-satoshi font-bold text-[14px]">Related Recipes</Text>
                                    <TouchableOpacity>
                                        <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">View all</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row flex-wrap justify-between mb-20">
                                    {relatedRecipes.map((r) => (
                                        <TouchableOpacity
                                            key={r.id}
                                            onPress={() => navigation.push('RecipeOverview', { recipeId: r.id })}
                                            className="w-[48%] mb-4 bg-white rounded-2xl p-1.5 border border-[#EEEEEE] shadow-sm"
                                        >
                                            <Image
                                                source={r.media.cover_image_url ? { uri: r.media.cover_image_url } : require('../../assets/images/egusi.png')}
                                                className="w-full h-28 rounded-[12px] mb-2"
                                                resizeMode="cover"
                                            />
                                            <View className="px-1">
                                                <Text className="text-[9px] font-satoshi font-bold text-[#424242] mb-0.5" numberOfLines={1}>{r.title}</Text>
                                                <Text className="text-[10px] font-satoshi font-bold text-[#424242] mb-1">₦{r.price}</Text>
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center">
                                                        <Image
                                                            source={r.chef_avatar ? { uri: r.chef_avatar } : require('../../assets/images/3d_avatar_3.png')}
                                                            className="w-3 h-3 rounded-full mr-1"
                                                        />
                                                        <Text className="text-[6px] font-satoshi text-[#9E9E9E]" numberOfLines={1}>{r.chef_name || 'Chef'}</Text>
                                                    </View>
                                                    <Ionicons name="bookmark" size={12} color="#4CAF50" />
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Sticky Global Button */}
                <View className="px-6 py-6 absolute bottom-0 w-full bg-white border-t border-gray-50">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('RecipeIngredients', { recipeId: recipe.id })}
                        className="bg-[#4CAF50] h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px] mr-2">View Recipe</Text>
                        <Ionicons name="list-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
