import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import { recipeService } from '../../utils/recipeService';

const CATEGORY_IMAGES: { [key: string]: any } = {
    'Egg Delights': require('../../assets/images/egg-delight.png'),
    // Add more mappings as discovered or use a default
    'DEFAULT': require('../../assets/images/egg-delight.png'),
};

export const RecipesScreen = ({ navigation }: any) => {
    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['recipe-categories'],
        queryFn: foodService.fetchCategories,
    });

    const { data: recipesResponse, isLoading: isRecipesLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: () => recipeService.listRecipes(),
    });

    const categories = categoriesResponse?.data || [];
    const recipes = recipesResponse?.data || [];

    const isLoading = isCategoriesLoading || isRecipesLoading;

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
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <Text className="text-[20px] font-satoshi font-bold text-[#424242]">Find The Right Recipe{"\n"}For Your Favorites</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SavedRecipes')}>
                        <Bookmark size={24} color="#424242" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="px-6 mt-4">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SearchHistory')}
                        className="h-12 bg-white border border-gray-100 rounded-xl flex-row items-center px-4 mb-6 shadow-sm"
                    >
                        <Text className="flex-1 font-satoshi text-sm text-[#BDBDBD]">
                            Search for recipes, chefs
                        </Text>
                        <Ionicons name="options-outline" size={18} color="#BDBDBD" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Quick Recipes (Categories) */}
                    <View className="px-6 mb-8">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px] mb-4">Quick Recipes</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                            {categories.map((catName, index) => (
                                <TouchableOpacity key={index} className="items-center mx-2 w-16">
                                    <View className="w-12 h-12 rounded-full overflow-hidden mb-2 border border-gray-100">
                                        <Image
                                            source={CATEGORY_IMAGES[catName] || CATEGORY_IMAGES.DEFAULT}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <Text className="text-[8px] font-satoshi font-bold text-[#424242] text-center" numberOfLines={1}>{catName}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Recommended Recipes */}
                    <View className="px-6 mb-10">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px] mb-4">Recommended Recipes</Text>
                        {recipes.length === 0 ? (
                            <View className="py-10 items-center">
                                <Text className="font-satoshi text-[#9E9E9E]">No recipes found</Text>
                            </View>
                        ) : (
                            recipes.map((recipe) => (
                                <TouchableOpacity
                                    key={recipe.id}
                                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                                    className="bg-white rounded-[24px] overflow-hidden mb-6 shadow-sm border border-gray-50"
                                >
                                    <View className="relative">
                                        <Image
                                            source={recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : require('../../assets/images/egusi.png')}
                                            className="w-full h-48"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded-md">
                                            <Text className="text-white text-[10px] font-bold">15:09</Text>
                                        </View>
                                    </View>
                                    <View className="p-4">
                                        <View className="flex-row justify-between items-center mb-1">
                                            <Text className="text-[14px] font-satoshi font-bold text-[#424242]">{recipe.title}</Text>
                                            <Text className="text-[14px] font-satoshi font-bold text-[#424242]">₦{recipe.price}</Text>
                                        </View>
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center">
                                                <Image
                                                    source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : require('../../assets/images/3d_avatar_3.png')}
                                                    className="w-5 h-5 rounded-full mr-2"
                                                />
                                                <View>
                                                    <Text className="text-[10px] font-satoshi font-bold text-[#424242]">{recipe.chef_name || 'Anonymous Chef'}</Text>
                                                    <View className="flex-row items-center">
                                                        <View className="bg-[#FFA000] w-2 h-2 rounded-full mr-1 items-center justify-center">
                                                            <Ionicons name="star" size={6} color="white" />
                                                        </View>
                                                        <Text className="text-[8px] font-satoshi text-[#9E9E9E]">{recipe.rating} Rating</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <TouchableOpacity>
                                                <Ionicons name="bookmark" size={20} color="#4CAF50" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
