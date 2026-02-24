import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Heart, MessageCircle, Share2, ThumbsDown } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService } from '../../utils/recipeService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const RecipeDetailScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const queryClient = useQueryClient();
    const [currentSegment, setCurrentSegment] = useState(0);

    const { data: recipeResponse, isLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const recipe = recipeResponse?.data;
    const numSegments = recipe?.instructions?.length || 1;

    const likeMutation = useMutation({
        mutationFn: () => recipeService.likeRecipe(recipeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            Toast.show({ type: 'success', text1: 'Recipe liked' });
        },
    });

    const dislikeMutation = useMutation({
        mutationFn: () => recipeService.dislikeRecipe(recipeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
            Toast.show({ type: 'success', text1: 'Recipe disliked' });
        },
    });

    const handleNextSegment = () => {
        if (currentSegment < numSegments - 1) {
            setCurrentSegment(currentSegment + 1);
        }
    };

    const handlePrevSegment = () => {
        if (currentSegment > 0) {
            setCurrentSegment(currentSegment - 1);
        }
    };

    if (isLoading || !recipe) {
        return (
            <ScreenWrapper bg="#000000">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#000000">
            <View className="flex-1 bg-black">
                {/* Background Image / Placeholder for video */}
                <Image
                    source={recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : require('../../assets/images/shakshuka.png')}
                    className="w-full h-full absolute"
                    resizeMode="cover"
                />

                {/* Gradient Overlay */}
                <View className="absolute inset-0 bg-black/30" />

                {/* Top Controls */}
                <View className="px-6 pt-10 flex-row items-center justify-between z-10">
                    {/* Progression Indicators */}
                    <View className="flex-1 flex-row space-x-1 pr-4">
                        {Array.from({ length: numSegments }).map((_, i) => (
                            <View
                                key={i}
                                className={`h-1 flex-1 rounded-full ${i <= currentSegment ? 'bg-white' : 'bg-white/30'}`}
                            />
                        ))}
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-white/20 rounded-full">
                        <Ionicons name="close" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Center Navigation Areas */}
                <View className="flex-1 flex-row">
                    <TouchableOpacity
                        className="flex-1"
                        onPress={handlePrevSegment}
                        activeOpacity={1}
                    />
                    <TouchableOpacity
                        className="flex-1"
                        onPress={handleNextSegment}
                        activeOpacity={1}
                    />
                </View>

                {/* Bottom Content Area */}
                <View className="px-6 pb-10">
                    <View className="mb-4">
                        <View className="flex-row items-center mb-2">
                            <Image
                                source={recipe.chef_avatar ? { uri: recipe.chef_avatar } : require('../../assets/images/3d_avatar_3.png')}
                                className="w-6 h-6 rounded-full mr-2"
                            />
                            <View>
                                <Text className="text-white font-satoshi font-bold text-[10px]">{recipe.chef_name || 'Chef'}</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={8} color="#FFA000" />
                                    <Text className="text-white/80 font-satoshi text-[8px] ml-1">{recipe.rating} Rating</Text>
                                </View>
                            </View>
                        </View>
                        <Text className="text-white font-satoshi font-bold text-[14px] mb-1">
                            {recipe.instructions[currentSegment]?.title || `Step ${currentSegment + 1}`}
                        </Text>
                        <Text className="text-white font-satoshi font-bold text-[24px] mb-2">{recipe.title}</Text>
                        <Text className="text-white/80 font-satoshi text-[12px] leading-[18px]">
                            {recipe.instructions[currentSegment]?.content || recipe.description}
                        </Text>
                    </View>

                    {/* Social Stats and Buttons */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center space-x-4">
                            <TouchableOpacity onPress={() => likeMutation.mutate()} className="flex-row items-center">
                                <Heart size={16} color="white" fill={recipe.likes_count > 0 ? "white" : "transparent"} />
                                <Text className="text-white font-satoshi font-bold text-[10px] ml-1.5">{recipe.likes_count.toLocaleString()} Likes</Text>
                            </TouchableOpacity>
                            <View className="flex-row items-center">
                                <MessageCircle size={16} color="white" />
                                <Text className="text-white font-satoshi font-bold text-[10px] ml-1.5">14 Comments</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center space-x-3">
                            <TouchableOpacity onPress={() => dislikeMutation.mutate()} className="bg-white/20 p-2 rounded-full">
                                <ThumbsDown size={18} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('RecipeOverview', { recipeId })} className="bg-[#4CAF50] h-10 px-6 rounded-full items-center justify-center">
                                <Text className="text-white font-satoshi font-bold text-[12px]">View Recipe</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-white/20 p-2 rounded-full">
                                <Share2 size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};
