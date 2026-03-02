import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Recipe, recipeService } from '../../utils/recipeService';

const FALLBACK_RECIPE_IMAGE = require('../../assets/images/egusi.png');
const FALLBACK_AVATAR = require('../../assets/images/3d_avatar_3.png');

const FILTERS = ['All', 'Quick', 'Recommended'] as const;
type RelatedFilter = typeof FILTERS[number];

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

export const RelatedRecipesScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<RelatedFilter>('All');
    const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);

    const queryClient = useQueryClient();

    const { data: detailResponse, isLoading: isDetailLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const baseRecipe = detailResponse?.data;
    const baseRelated = detailResponse?.related_recipes || [];
    const chefUsername = baseRecipe?.chef?.username;

    const { data: sameChefResponse, isLoading: isChefRecipesLoading } = useQuery({
        queryKey: ['related-recipes-chef', recipeId, chefUsername],
        queryFn: () => recipeService.listRecipes({ chef_username: chefUsername, limit: 60 }),
        enabled: !!chefUsername,
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
                queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] }),
                queryClient.invalidateQueries({ queryKey: ['recommended-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['quick-recipes'] }),
            ]);
        },
    });

    const bookmarkedIds = useMemo(() => {
        const ids = new Set<string>();
        (bookmarkedResponse?.data || []).forEach((item) => ids.add(item.id));
        return ids;
    }, [bookmarkedResponse?.data]);

    const allRelatedRecipes = useMemo(() => {
        const merged = [...baseRelated, ...(sameChefResponse?.data || [])];
        const unique = new Map<string, Recipe>();

        merged.forEach((item) => {
            if (!item?.id || item.id === recipeId) return;
            if (!unique.has(item.id)) unique.set(item.id, item);
        });

        return Array.from(unique.values());
    }, [baseRelated, sameChefResponse?.data, recipeId]);

    const filteredRecipes = useMemo(() => {
        const searchTerm = query.trim().toLowerCase();

        return allRelatedRecipes.filter((item) => {
            const filterMatch =
                activeFilter === 'All'
                    ? true
                    : activeFilter === 'Quick'
                        ? Boolean(item.is_quick_recipe)
                        : Boolean(item.is_recommended);

            if (!filterMatch) return false;
            if (!searchTerm) return true;

            const haystack = `${item.title} ${item.short_description || ''} ${item.chef_name || ''}`.toLowerCase();
            return haystack.includes(searchTerm);
        });
    }, [allRelatedRecipes, activeFilter, query]);

    const toggleBookmark = async (id: string) => {
        if (!id || pendingBookmarkId) return;
        const shouldBookmark = !bookmarkedIds.has(id);
        setPendingBookmarkId(id);

        try {
            await bookmarkMutation.mutateAsync({ id, shouldBookmark });
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

    if (isDetailLoading) {
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
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg">
                        <Ionicons name="arrow-back" size={18} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Related Recipes</Text>
                    <View className="w-9" />
                </View>

                <View className="px-6 pt-4 pb-3 bg-white border-b border-gray-50">
                    <View className="h-11 bg-[#FAFAFA] border border-[#EAEAEA] rounded-xl flex-row items-center px-3 mb-3">
                        <Ionicons name="search-outline" size={18} color="#9E9E9E" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search related recipes"
                            placeholderTextColor="#BDBDBD"
                            className="flex-1 ml-2 text-[14px] font-satoshi text-[#424242]"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {isChefRecipesLoading ? <ActivityIndicator size="small" color="#4CAF50" /> : null}
                    </View>

                    <View className="flex-row">
                        {FILTERS.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-lg mr-2 border ${
                                    activeFilter === filter
                                        ? 'bg-[#4CAF50] border-[#4CAF50]'
                                        : 'bg-white border-[#E0E0E0]'
                                }`}
                            >
                                <Text className={`font-satoshi font-bold text-[12px] ${activeFilter === filter ? 'text-white' : 'text-[#757575]'}`}>
                                    {filter}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-5" contentContainerStyle={{ paddingBottom: 24 }}>
                    {filteredRecipes.length === 0 ? (
                        <View className="py-24 items-center">
                            <Text className="text-[#757575] font-satoshi font-bold text-[16px]">No related recipes found</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[13px] mt-1 text-center">
                                Try a different filter or search term.
                            </Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap justify-between">
                            {filteredRecipes.map((item) => {
                                const isBookmarked = bookmarkedIds.has(item.id);
                                const isBookmarkPending = pendingBookmarkId === item.id;

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
                                                <Text className="text-[12px] font-satoshi font-bold text-[#424242] flex-1 pr-1" numberOfLines={2}>
                                                    {item.title}
                                                </Text>
                                                <Text className="text-[11px] font-satoshi font-bold text-[#424242]">
                                                    {formatNaira(item.estimated_cost ?? item.price)}
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center flex-1 pr-2">
                                                    <Image
                                                        source={item.chef_avatar ? { uri: item.chef_avatar } : FALLBACK_AVATAR}
                                                        className="w-4 h-4 rounded-full mr-1"
                                                    />
                                                    <Text className="text-[8px] font-satoshi text-[#9E9E9E] flex-1" numberOfLines={1}>
                                                        {item.chef_name || 'Chef'}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity onPress={() => toggleBookmark(item.id)} disabled={isBookmarkPending}>
                                                    {isBookmarkPending ? (
                                                        <ActivityIndicator size="small" color="#4CAF50" />
                                                    ) : (
                                                        <Ionicons
                                                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                            size={13}
                                                            color={isBookmarked ? '#4CAF50' : '#9E9E9E'}
                                                        />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
