import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heart, Share2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Recipe, recipeService } from '../../utils/recipeService';

const FALLBACK_RECIPE_IMAGE = require('../../assets/images/shakshuka.png');
const FALLBACK_AVATAR = require('../../assets/images/3d_avatar_3.png');

const formatDuration = (durationSeconds: number | undefined) => {
    if (!durationSeconds || durationSeconds <= 0) return 'Quick';
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const storySummary = (recipe: Recipe) => {
    const summary = recipe.short_description || recipe.description || '';
    return summary.length > 150 ? `${summary.slice(0, 150).trim()}...` : summary;
};

export const RecipeStoryScreen = ({ route, navigation }: any) => {
    const params = route?.params || {};
    const passedRecipes = Array.isArray(params.recipes) ? (params.recipes as Recipe[]) : [];
    const initialIndex = Number(params.initialIndex || 0);
    const recipeId = typeof params.recipeId === 'string' ? params.recipeId : undefined;

    const queryClient = useQueryClient();

    const [index, setIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    const [pendingBookmarkId, setPendingBookmarkId] = useState<string | null>(null);

    const { data: singleRecipeResponse, isLoading: isSingleRecipeLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId as string),
        enabled: passedRecipes.length === 0 && !!recipeId,
    });

    const recipes = useMemo(() => {
        if (passedRecipes.length > 0) return passedRecipes;
        if (singleRecipeResponse?.data) return [singleRecipeResponse.data];
        return [] as Recipe[];
    }, [passedRecipes, singleRecipeResponse?.data]);

    const current = recipes[index];
    const hasVideo = Boolean(current?.media?.video_url);

    const videoPlayerHtml = useMemo(() => {
        if (!current?.media?.video_url) return '';

        const videoUrl = current.media.video_url;
        const posterUrl = current.media.cover_image_url || '';

        return `
            <!doctype html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    overflow: hidden;
                  }
                  .container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #000;
                  }
                  video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    background: #000;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <video
                    controls
                    autoplay
                    playsinline
                    webkit-playsinline
                    poster="${posterUrl}"
                    src="${videoUrl}"
                  ></video>
                </div>
              </body>
            </html>
        `;
    }, [current?.media?.cover_image_url, current?.media?.video_url]);

    useEffect(() => {
        if (recipes.length === 0) return;
        if (index >= recipes.length) {
            setIndex(0);
        }
    }, [recipes.length, index]);

    useEffect(() => {
        if (!current || hasVideo || index >= recipes.length - 1) return;
        const timeout = setTimeout(() => {
            setIndex((prev) => Math.min(prev + 1, recipes.length - 1));
        }, 7000);

        return () => clearTimeout(timeout);
    }, [current, hasVideo, index, recipes.length]);

    const { data: bookmarkedResponse } = useQuery({
        queryKey: ['bookmarked-recipes'],
        queryFn: () => recipeService.listBookmarkedRecipes(),
    });

    const bookmarkedIds = useMemo(() => {
        const ids = new Set<string>();
        (bookmarkedResponse?.data || []).forEach((recipe) => ids.add(recipe.id));
        return ids;
    }, [bookmarkedResponse?.data]);

    const bookmarkMutation = useMutation({
        mutationFn: async ({ recipeId: id, shouldBookmark }: { recipeId: string; shouldBookmark: boolean }) => {
            if (shouldBookmark) {
                return recipeService.bookmarkRecipe(id);
            }
            return recipeService.unbookmarkRecipe(id);
        },
        onSuccess: async (_data, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['bookmarked-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] }),
                queryClient.invalidateQueries({ queryKey: ['recommended-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['quick-recipes'] }),
            ]);
        },
    });

    const toggleBookmark = async () => {
        if (!current || pendingBookmarkId) return;

        const shouldBookmark = !bookmarkedIds.has(current.id);
        setPendingBookmarkId(current.id);

        try {
            await bookmarkMutation.mutateAsync({ recipeId: current.id, shouldBookmark });
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
        if (!current) return;

        try {
            await Share.share({
                message: `${current.title}\n\nCheck out this recipe on Grovine.`,
            });
        } catch {
            // no-op
        }
    };

    const next = () => {
        if (recipes.length === 0) return;
        setIndex((prev) => Math.min(prev + 1, recipes.length - 1));
    };

    const prev = () => {
        if (recipes.length === 0) return;
        setIndex((prev) => Math.max(prev - 1, 0));
    };

    if (isSingleRecipeLoading || !current) {
        return (
            <ScreenWrapper bg="#000000" barStyle="light-content" statusBarColor="#000000">
                <View className="flex-1 items-center justify-center bg-black">
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            </ScreenWrapper>
        );
    }

    const isBookmarked = bookmarkedIds.has(current.id);

    return (
        <ScreenWrapper bg="#000000" barStyle="light-content" statusBarColor="#000000">
            <View className="flex-1 bg-black">
                {hasVideo ? (
                    <WebView
                        source={{ html: videoPlayerHtml }}
                        className="absolute inset-0"
                        javaScriptEnabled
                        domStorageEnabled
                        allowsInlineMediaPlayback
                        mediaPlaybackRequiresUserAction={false}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        bounces={false}
                    />
                ) : (
                    <Image
                        source={current.media.cover_image_url ? { uri: current.media.cover_image_url } : FALLBACK_RECIPE_IMAGE}
                        className="absolute inset-0 w-full h-full"
                        resizeMode="cover"
                    />
                )}
                <View pointerEvents="none" className="absolute inset-0 bg-black/30" />

                <View className="pt-6 px-5">
                    <View className="flex-row mb-5">
                        {recipes.map((recipe, itemIndex) => (
                            <View
                                key={recipe.id}
                                className={`h-1 flex-1 rounded-full ${itemIndex <= index ? 'bg-white' : 'bg-white/30'} ${itemIndex === recipes.length - 1 ? '' : 'mr-1'}`}
                            />
                        ))}
                    </View>

                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-10 h-10 items-center justify-center border border-white/60 rounded-xl bg-black/20"
                        >
                            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleBookmark}
                            disabled={pendingBookmarkId === current.id}
                            className="w-10 h-10 items-center justify-center border border-white/60 rounded-xl bg-black/20"
                        >
                            {pendingBookmarkId === current.id ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {!hasVideo ? (
                    <View className="absolute inset-0 flex-row">
                        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={prev} />
                        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={next} />
                    </View>
                ) : null}

                <View className="px-5 pb-8 mt-auto">
                    <Text className="text-white/80 font-satoshi font-bold text-[12px] mb-1">Story List  {'>'}  Quick Recipes</Text>
                    <Text className="text-white font-satoshi font-bold text-[34px]" style={{ fontSize: 34, lineHeight: 38 }}>
                        {current.title}
                    </Text>
                    <Text className="text-white/90 font-satoshi text-[16px] leading-[24px] mt-1 mb-4" style={{ fontSize: 16, lineHeight: 24 }}>
                        {storySummary(current)}
                    </Text>

                    <View className="flex-row items-center mb-5">
                        <View className="flex-row items-center bg-white/90 rounded-lg px-2 py-1 mr-2">
                            <Image
                                source={current.chef_avatar ? { uri: current.chef_avatar } : FALLBACK_AVATAR}
                                className="w-6 h-6 rounded-full mr-2"
                            />
                            <View>
                                <Text className="text-[#424242] font-satoshi font-bold text-[11px]">{current.chef_name || 'Chef'}</Text>
                                <Text className="text-[#7D7D7D] font-satoshi text-[10px]">Quick Recipe</Text>
                            </View>
                        </View>

                        <View className="flex-row items-center bg-white/20 rounded-lg px-3 py-2 mr-2">
                            <Heart size={18} color="#FFFFFF" />
                            <Text className="text-white font-satoshi font-bold text-[12px] ml-2">
                                {Number(current.bookmarks_count || current.likes_count || 0).toLocaleString()} Likes
                            </Text>
                        </View>

                        <TouchableOpacity onPress={onShare} className="bg-white/20 rounded-lg p-2.5">
                            <Share2 size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('RecipeDetail', { recipeId: current.id })}
                        className="bg-[#4CAF50] h-14 rounded-xl items-center justify-center"
                    >
                        <View className="flex-row items-center">
                            <Text className="text-white font-satoshi font-bold text-[16px] mr-2" style={{ fontSize: 16, lineHeight: 20 }}>
                                View Recipe
                            </Text>
                            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Text className="text-white/75 font-satoshi text-[11px] mt-3 text-center">Duration: {formatDuration(current.duration_seconds)}</Text>
                </View>
            </View>
        </ScreenWrapper>
    );
};
