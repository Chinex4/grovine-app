import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Recipe, recipeService } from '../../utils/recipeService';

const FALLBACK_RECIPE_IMAGE = require('../../assets/images/egusi.png');
const FALLBACK_AVATAR = require('../../assets/images/3d_avatar_3.png');

const formatNaira = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return `₦${safeValue.toLocaleString()}`;
};

const formatDuration = (durationSeconds: number | undefined) => {
    if (!durationSeconds || durationSeconds <= 0) return 'Quick';
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getRecipeImage = (recipe: Recipe) =>
    recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : FALLBACK_RECIPE_IMAGE;

export const SavedRecipesScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();
    const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);

    const {
        data: bookmarkedResponse,
        isLoading,
        isRefetching,
    } = useQuery({
        queryKey: ['bookmarked-recipes'],
        queryFn: () => recipeService.listBookmarkedRecipes(),
    });

    const bookmarkedRecipes = bookmarkedResponse?.data || [];

    const bookmarkedIds = useMemo(() => {
        const ids = new Set<string>();
        bookmarkedRecipes.forEach((recipe) => ids.add(recipe.id));
        return ids;
    }, [bookmarkedRecipes]);

    const bookmarkMutation = useMutation({
        mutationFn: async ({ recipeId, shouldBookmark }: { recipeId: string; shouldBookmark: boolean }) => {
            if (shouldBookmark) {
                return recipeService.bookmarkRecipe(recipeId);
            }
            return recipeService.unbookmarkRecipe(recipeId);
        },
        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bookmarked-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recommended-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['quick-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] }),
            ]);
        },
    });

    const toggleBookmark = async (recipeId: string) => {
        if (!recipeId || pendingBookmarkId) return;

        const shouldBookmark = !bookmarkedIds.has(recipeId);
        setPendingBookmarkId(recipeId);

        try {
            await bookmarkMutation.mutateAsync({ recipeId, shouldBookmark });
            Toast.show({ type: 'success', text1: shouldBookmark ? 'Recipe saved' : 'Recipe removed from saved' });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Could not update saved recipes',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        } finally {
            setPendingBookmarkId(null);
        }
    };

    if (isLoading && !isRefetching) {
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
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Saved Recipes</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 20 }}>
                    {bookmarkedRecipes.length === 0 ? (
                        <View className="py-24 items-center">
                            <Ionicons name="bookmark-outline" size={36} color="#BDBDBD" />
                            <Text className="text-[#757575] font-satoshi font-bold text-[16px] mt-3">No saved recipes yet</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[13px] mt-1 text-center">
                                Save recipes from the recipes screen to access them here.
                            </Text>
                        </View>
                    ) : (
                        bookmarkedRecipes.map((recipe) => {
                            const isBookmarked = bookmarkedIds.has(recipe.id);
                            const isBookmarkPending = pendingBookmarkId === recipe.id;

                            return (
                                <TouchableOpacity
                                    key={recipe.id}
                                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                                    className="bg-white rounded-[24px] overflow-hidden mb-6 border border-gray-50 shadow-sm"
                                >
                                    <View className="relative">
                                        <Image source={getRecipeImage(recipe)} className="w-full h-48" resizeMode="cover" />
                                        <View className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded-md">
                                            <Text className="text-white text-[10px] font-bold">{formatDuration(recipe.duration_seconds)}</Text>
                                        </View>
                                    </View>
                                    <View className="p-4">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-[14px] font-satoshi font-bold text-[#424242] flex-1 pr-3" numberOfLines={1}>
                                                {recipe.title}
                                            </Text>
                                            <Text className="text-[14px] font-satoshi font-bold text-[#424242]">
                                                {formatNaira(recipe.estimated_cost ?? recipe.price)}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between mb-4">
                                            <View className="flex-row items-center flex-1 pr-2">
                                                <Image
                                                    source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : FALLBACK_AVATAR}
                                                    className="w-5 h-5 rounded-full mr-2"
                                                />
                                                <View>
                                                    <Text className="text-[10px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                                        {recipe.chef_name || 'Chef'}
                                                    </Text>
                                                    <Text className="text-[8px] font-satoshi text-[#9E9E9E]">
                                                        {Number(recipe.bookmarks_count || recipe.likes_count || 0).toLocaleString()} saves
                                                    </Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity onPress={() => toggleBookmark(recipe.id)} disabled={isBookmarkPending}>
                                                {isBookmarkPending ? (
                                                    <ActivityIndicator size="small" color="#4CAF50" />
                                                ) : (
                                                    <Ionicons
                                                        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                        size={20}
                                                        color={isBookmarked ? '#4CAF50' : '#BDBDBD'}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('RecipeIngredients', { recipeId: recipe.id })}
                                            className="bg-[#4CAF50] h-12 rounded-xl flex-row items-center justify-center"
                                        >
                                            <Text className="text-white font-satoshi font-bold text-[12px] mr-2">Add Ingredients to Cart</Text>
                                            <ShoppingCart size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
