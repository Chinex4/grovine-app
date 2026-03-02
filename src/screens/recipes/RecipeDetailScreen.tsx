import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Share,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Heart, Share2 } from 'lucide-react-native';
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

const shortText = (value: string, max = 140) => {
    if (value.length <= max) return value;
    return `${value.slice(0, max).trim()}...`;
};

const getRecipeImage = (recipe: Recipe) =>
    recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : FALLBACK_RECIPE_IMAGE;

export const RecipeDetailScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: recipeResponse, isLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const { data: bookmarkedResponse } = useQuery({
        queryKey: ['bookmarked-recipes'],
        queryFn: () => recipeService.listBookmarkedRecipes(),
    });

    const bookmarkMutation = useMutation({
        mutationFn: async ({ id, shouldBookmark }: { id: string; shouldBookmark: boolean }) => {
            if (shouldBookmark) {
                return recipeService.bookmarkRecipe(id);
            }
            return recipeService.unbookmarkRecipe(id);
        },
        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bookmarked-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] }),
                queryClient.invalidateQueries({ queryKey: ['recommended-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['quick-recipes'] }),
            ]);
        },
    });

    const recipe = recipeResponse?.data;
    const relatedRecipes = recipeResponse?.related_recipes || recipeResponse?.relatedRecipes || [];

    const bookmarkedIds = useMemo(() => {
        const ids = new Set<string>();
        (bookmarkedResponse?.data || []).forEach((item) => ids.add(item.id));
        return ids;
    }, [bookmarkedResponse?.data]);

    const isBookmarked = recipe ? bookmarkedIds.has(recipe.id) : false;

    const toggleBookmark = async () => {
        if (!recipe || pendingBookmarkId) return;

        const shouldBookmark = !bookmarkedIds.has(recipe.id);
        setPendingBookmarkId(recipe.id);

        try {
            await bookmarkMutation.mutateAsync({ id: recipe.id, shouldBookmark });
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

    const onShare = async () => {
        if (!recipe) return;

        try {
            await Share.share({
                message: `${recipe.title}\n\n${recipe.short_description || recipe.description || ''}`,
            });
        } catch {
            // no-op
        }
    };

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
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-[#424242] font-satoshi font-bold text-[16px]">Recipe not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-5 bg-[#4CAF50] px-6 py-3 rounded-lg">
                        <Text className="text-white font-satoshi font-bold">Go back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const description = recipe.short_description || recipe.description || '';
    const shouldCollapse = description.length > 140;
    const visibleDescription = showFullDescription || !shouldCollapse ? description : shortText(description, 140);

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1 bg-white">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg">
                        <Ionicons name="arrow-back" size={18} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Recipe Detail</Text>
                    <View className="w-9" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
                    <View className="px-6 pt-6">
                        <View className="relative">
                            <Image source={getRecipeImage(recipe)} className="w-full h-56 rounded-[22px]" resizeMode="cover" />
                            <View className="absolute bottom-3 right-3 bg-black/55 px-2 py-1 rounded-md">
                                <Text className="text-white text-[10px] font-bold">{formatDuration(recipe.duration_seconds)}</Text>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 pt-5">
                        <Text className="text-[30px] font-satoshi font-bold text-[#424242]" style={{ fontSize: 30, lineHeight: 34 }}>
                            {recipe.title}
                        </Text>

                        <Text className="text-[16px] font-satoshi text-[#9E9E9E] leading-[24px] mt-1" style={{ fontSize: 16, lineHeight: 24 }}>
                            {visibleDescription}
                            {shouldCollapse && !showFullDescription ? (
                                <Text onPress={() => setShowFullDescription(true)} className="text-[#4CAF50] font-satoshi font-bold">
                                    {' '}view more.....
                                </Text>
                            ) : null}
                        </Text>

                        <View className="flex-row items-center justify-between mt-5 mb-7">
                            <View className="flex-row items-center flex-1 pr-3">
                                <Image
                                    source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : FALLBACK_AVATAR}
                                    className="w-9 h-9 rounded-full mr-2"
                                />
                                <View className="flex-1">
                                    <Text className="text-[14px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                        {recipe.chef_name || 'Chef'}
                                    </Text>
                                    <Text className="text-[10px] font-satoshi text-[#9E9E9E]">{recipe.rating || 0} Rating</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <View className="bg-white border border-[#E0E0E0] rounded-lg px-3 py-2 flex-row items-center mr-2">
                                    <Heart size={16} color="#757575" />
                                    <Text className="text-[#757575] font-satoshi font-bold text-[12px] ml-2">
                                        {Number(recipe.bookmarks_count || recipe.likes_count || 0).toLocaleString()} Likes
                                    </Text>
                                </View>

                                <TouchableOpacity onPress={onShare} className="bg-white border border-[#E0E0E0] rounded-lg p-2 mr-2">
                                    <Share2 size={16} color="#757575" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={toggleBookmark}
                                    disabled={pendingBookmarkId === recipe.id}
                                    className="bg-white border border-[#E0E0E0] rounded-lg p-2"
                                >
                                    {pendingBookmarkId === recipe.id ? (
                                        <ActivityIndicator size="small" color="#4CAF50" />
                                    ) : (
                                        <Ionicons
                                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                            size={18}
                                            color={isBookmarked ? '#4CAF50' : '#757575'}
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-[#9E9E9E] font-satoshi font-bold text-[16px]">Related Recipes</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('RelatedRecipes', { recipeId: recipe.id })}>
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[14px]">View all</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap justify-between">
                            {relatedRecipes.slice(0, 4).map((item: Recipe) => {
                                const itemIsBookmarked = bookmarkedIds.has(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => navigation.push('RecipeDetail', { recipeId: item.id })}
                                        className="w-[48%] mb-4 bg-white rounded-xl p-1.5 border border-[#EEEEEE]"
                                    >
                                        <View className="relative">
                                            <Image source={getRecipeImage(item)} className="w-full h-28 rounded-lg" resizeMode="cover" />
                                            <View className="absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded">
                                                <Text className="text-white text-[8px] font-bold">{formatDuration(item.duration_seconds)}</Text>
                                            </View>
                                        </View>

                                        <View className="px-1 pt-1">
                                            <View className="flex-row justify-between items-start mb-1">
                                                <Text className="text-[11px] font-satoshi font-bold text-[#424242] flex-1 pr-1" numberOfLines={2}>
                                                    {item.title}
                                                </Text>
                                                <Text className="text-[11px] font-satoshi font-bold text-[#424242]">
                                                    {formatNaira(item.estimated_cost ?? item.price)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-[8px] font-satoshi text-[#9E9E9E] flex-1" numberOfLines={1}>
                                                    {item.chef_name || 'Chef'}
                                                </Text>
                                                <Ionicons
                                                    name={itemIsBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                    size={12}
                                                    color={itemIsBookmarked ? '#4CAF50' : '#9E9E9E'}
                                                />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>

                <View className="px-6 py-5 absolute bottom-0 w-full bg-white border-t border-gray-100">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('RecipeIngredients', { recipeId: recipe.id })}
                        className="bg-[#4CAF50] h-14 rounded-xl flex-row items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px] mr-2" style={{ fontSize: 16, lineHeight: 20 }}>
                            View Recipe
                        </Text>
                        <Ionicons name="list-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
