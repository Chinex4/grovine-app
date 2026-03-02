import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Bookmark } from 'lucide-react-native';
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

export const RecipesScreen = ({ navigation }: any) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 350);

        return () => clearTimeout(timeout);
    }, [query]);

    const {
        data: quickResponse,
        isLoading: isQuickLoading,
        isRefetching: isQuickRefetching,
    } = useQuery({
        queryKey: ['quick-recipes'],
        queryFn: () => recipeService.listQuickRecipes(),
    });

    const {
        data: recommendedResponse,
        isLoading: isRecommendedLoading,
        isRefetching: isRecommendedRefetching,
    } = useQuery({
        queryKey: ['recommended-recipes'],
        queryFn: () => recipeService.listRecommendedRecipes(),
    });

    const {
        data: searchResponse,
        isLoading: isSearchLoading,
        isFetching: isSearchFetching,
    } = useQuery({
        queryKey: ['recipes-search', debouncedQuery],
        queryFn: () => recipeService.listRecipes({ q: debouncedQuery, limit: 30 }),
        enabled: debouncedQuery.length > 0,
    });

    const { data: bookmarkedResponse, isLoading: isBookmarksLoading } = useQuery({
        queryKey: ['bookmarked-recipes'],
        queryFn: () => recipeService.listBookmarkedRecipes(),
    });

    const bookmarkMutation = useMutation({
        mutationFn: async ({ recipeId, shouldBookmark }: { recipeId: string; shouldBookmark: boolean }) => {
            if (shouldBookmark) {
                return recipeService.bookmarkRecipe(recipeId);
            }
            return recipeService.unbookmarkRecipe(recipeId);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bookmarked-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recommended-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['quick-recipes'] }),
            ]);
        },
    });

    const quickRecipes = quickResponse?.data || [];
    const recommendedRecipes = recommendedResponse?.data || [];
    const searchedRecipes = searchResponse?.data || [];
    const visibleRecipes = debouncedQuery ? searchedRecipes : recommendedRecipes;

    const bookmarkedIds = useMemo(() => {
        const ids = new Set<string>();
        (bookmarkedResponse?.data || []).forEach((recipe) => ids.add(recipe.id));
        return ids;
    }, [bookmarkedResponse?.data]);

    const isRefreshing = isQuickRefetching || isRecommendedRefetching || isSearchFetching;

    const toggleBookmark = async (recipeId: string) => {
        if (!recipeId || pendingBookmarkId) return;

        setPendingBookmarkId(recipeId);
        const shouldBookmark = !bookmarkedIds.has(recipeId);

        try {
            await bookmarkMutation.mutateAsync({ recipeId, shouldBookmark });
            Toast.show({
                type: 'success',
                text1: shouldBookmark ? 'Recipe saved' : 'Recipe removed from saved',
            });
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

    const openStory = (index: number) => {
        if (quickRecipes.length === 0) return;
        navigation.navigate('RecipeStory', {
            recipes: quickRecipes,
            initialIndex: index,
        });
    };

    if ((isQuickLoading || isRecommendedLoading || isBookmarksLoading) && !isRefreshing) {
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
                <View className="px-6 pt-10 pb-4 flex-row items-start justify-between">
                    <Text className="text-[24px] font-satoshi font-bold text-[#424242] flex-1 pr-3" style={{ fontSize: 24, lineHeight: 32 }}>
                        Find The Right Recipe{"\n"}For Your Favorites
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SavedRecipes')}>
                        <Bookmark size={24} color="#424242" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 mt-2 mb-5">
                    <View className="h-12 bg-white border border-[#E0E0E0] rounded-xl flex-row items-center px-3">
                        <Ionicons name="search-outline" size={18} color="#BDBDBD" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search for recipes, chefs"
                            placeholderTextColor="#BDBDBD"
                            className="flex-1 ml-2 text-[14px] font-satoshi text-[#424242]"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {isSearchLoading || isSearchFetching ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <Ionicons name="options-outline" size={18} color="#BDBDBD" />
                        )}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
                    <View className="px-6 mb-8">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[18px] mb-4" style={{ fontSize: 18, lineHeight: 22 }}>
                            Quick Recipes
                        </Text>

                        {isQuickLoading ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : quickRecipes.length === 0 ? (
                            <Text className="text-[13px] font-satoshi text-[#9E9E9E]">No quick recipes available.</Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                                {quickRecipes.map((recipe, index) => (
                                    <TouchableOpacity key={recipe.id} className="items-center mx-2 w-20" onPress={() => openStory(index)}>
                                        <View className="w-16 h-16 rounded-full overflow-hidden mb-2 border border-[#4CAF50]">
                                            <Image source={getRecipeImage(recipe)} className="w-full h-full" resizeMode="cover" />
                                        </View>
                                        <Text className="text-[11px] font-satoshi font-bold text-[#424242] text-center" numberOfLines={2}>
                                            {recipe.title || 'Quick Recipe'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    <View className="px-6 mb-8">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[18px] mb-4" style={{ fontSize: 18, lineHeight: 22 }}>
                            {debouncedQuery ? 'Search Results' : 'Recommended Recipes'}
                        </Text>

                        {visibleRecipes.length === 0 ? (
                            <View className="py-10 items-center">
                                <Text className="font-satoshi text-[#9E9E9E]">
                                    {debouncedQuery ? 'No recipes match your search.' : 'No recommended recipes yet.'}
                                </Text>
                            </View>
                        ) : (
                            visibleRecipes.map((recipe) => {
                                const isBookmarked = bookmarkedIds.has(recipe.id);
                                const isBookmarkPending = pendingBookmarkId === recipe.id;

                                return (
                                    <TouchableOpacity
                                        key={recipe.id}
                                        onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                                        className="bg-white rounded-[24px] overflow-hidden mb-6 shadow-sm border border-gray-50"
                                    >
                                        <View className="relative">
                                            <Image source={getRecipeImage(recipe)} className="w-full h-52" resizeMode="cover" />
                                            <View className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded-md">
                                                <Text className="text-white text-[10px] font-bold">{formatDuration(recipe.duration_seconds)}</Text>
                                            </View>
                                        </View>

                                        <View className="p-4">
                                            <View className="flex-row justify-between items-center mb-1">
                                                <Text className="text-[19px] font-satoshi font-bold text-[#424242] flex-1 pr-3" numberOfLines={1} style={{ fontSize: 19, lineHeight: 24 }}>
                                                    {recipe.title}
                                                </Text>
                                                <Text className="text-[20px] font-satoshi font-bold text-[#424242]" style={{ fontSize: 20, lineHeight: 24 }}>
                                                    {formatNaira(recipe.estimated_cost ?? recipe.price)}
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1 pr-3">
                                                    <Image
                                                        source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : FALLBACK_AVATAR}
                                                        className="w-6 h-6 rounded-full mr-2"
                                                    />
                                                    <View>
                                                        <Text className="text-[12px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                                            {recipe.chef_name || 'Chef'}
                                                        </Text>
                                                        <Text className="text-[10px] font-satoshi text-[#9E9E9E]">
                                                            {Number(recipe.bookmarks_count || recipe.likes_count || 0).toLocaleString()} saves
                                                        </Text>
                                                    </View>
                                                </View>

                                                <TouchableOpacity
                                                    onPress={() => toggleBookmark(recipe.id)}
                                                    disabled={isBookmarkPending}
                                                    className="w-9 h-9 items-center justify-center"
                                                >
                                                    {isBookmarkPending ? (
                                                        <ActivityIndicator size="small" color="#4CAF50" />
                                                    ) : (
                                                        <Ionicons
                                                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                            size={20}
                                                            color={isBookmarked ? '#4CAF50' : '#9E9E9E'}
                                                        />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
