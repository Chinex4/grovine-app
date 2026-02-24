import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Share2, Heart, Star, Plus } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chefService } from '../../utils/chefService';
import { recipeService } from '../../utils/recipeService';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const ChefProfileScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();
    const { data: chefResponse, isLoading: isChefLoading, error: chefError } = useQuery({
        queryKey: ['chef-profile'],
        queryFn: () => chefService.getOwnProfile(),
    });

    const chef = chefResponse?.data;

    const { data: recipesResponse, isLoading: isRecipesLoading } = useQuery({
        queryKey: ['recipes'],
        queryFn: () => recipeService.listRecipes({ per_page: 100 }),
        enabled: !!chef,
    });

    const likeMutation = useMutation({
        mutationFn: () => chefService.likeChef(chef?.id!),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Chef Liked!' });
            queryClient.invalidateQueries({ queryKey: ['chef-profile'] });
        },
    });

    const rateMutation = useMutation({
        mutationFn: (rating: number) => chefService.rateChef(chef?.id!, rating),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Rating submitted!' });
            queryClient.invalidateQueries({ queryKey: ['chef-profile'] });
        },
    });

    const chefVideos = recipesResponse?.data?.filter((r: any) => r.chef_id === chef?.id) || [];

    if (isChefLoading) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    if (chefError || !chef) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color="#E0E0E0" />
                    <Text className="text-[16px] font-satoshi font-bold text-[#9E9E9E] mt-4 text-center">
                        Failed to load chef profile. Please make sure you are registered as a chef.
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChefSignup')}
                        className="mt-6 bg-[#4CAF50] px-8 py-3 rounded-xl"
                    >
                        <Text className="text-white font-satoshi font-bold">Go to Registration</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header Banner */}
                <View className="relative h-44">
                    <Image
                        source={require('../../assets/images/banner.png')}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="absolute top-10 left-6 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Profile Section */}
                <View className="px-6 -mt-12 mb-6">
                    <View className="flex-row items-end justify-between">
                        <View className="relative">
                            <Image
                                source={chef.profile_picture?.url ? { uri: chef.profile_picture.url } : require('../../assets/images/3d_avatar_3.png')}
                                className="w-24 h-24 rounded-full border-4 border-white"
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('WalletPayment')}
                            className="bg-[#4CAF50] px-4 py-2 rounded-lg flex-row items-center mb-1"
                        >
                            <Text className="text-white font-satoshi font-bold text-[10px] mr-2">View Wallet</Text>
                            <Ionicons name="wallet-outline" size={14} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-4 flex-row items-center">
                        <Text className="text-[22px] font-satoshi font-bold text-[#424242] mr-3">{chef.name}</Text>
                        <TouchableOpacity
                            onPress={() => rateMutation.mutate(5)}
                            className="flex-row items-center"
                        >
                            <Star size={12} color="#FFD700" fill="#FFD700" />
                            <Text className="text-[#424242]/60 font-satoshi font-bold text-[10px] ml-1">{chef.rating || '0.0'} Ratings</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center mt-4 space-x-2">
                        <TouchableOpacity
                            onPress={() => likeMutation.mutate()}
                            disabled={likeMutation.isPending}
                            className={`bg-white border border-gray-100 px-3 py-1.5 rounded-lg flex-row items-center ${likeMutation.isPending ? 'opacity-50' : ''}`}
                        >
                            <Heart size={14} color="#424242" fill={likeMutation.isSuccess ? "#F44336" : "none"} />
                            <Text className="text-[#424242] font-satoshi font-bold text-[10px] ml-1.5">{chef.likes?.toLocaleString() || 0} Likes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-white border border-gray-100 p-2 rounded-lg">
                            <Share2 size={14} color="#424242" />
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-[#4CAF50] px-4 py-2 rounded-lg flex-row items-center">
                            <Ionicons name="create-outline" size={14} color="white" />
                            <Text className="text-white font-satoshi font-bold text-[10px] ml-1.5">Edit Profile</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Main')}
                        className="mt-6 bg-[#4CAF50]/10 border border-[#4CAF50]/30 py-3 px-4 rounded-xl flex-row items-center self-start"
                    >
                        <View className="w-8 h-8 rounded-full bg-[#4CAF50] items-center justify-center mr-3">
                            <Ionicons name="people" size={16} color="white" />
                        </View>
                        <Text className="text-[#4CAF50] font-satoshi font-bold text-[14px]">Switch To User Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Niches */}
                <View className="px-6 mb-8">
                    <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px] mb-4">Niche</Text>
                    <View className="flex-row flex-wrap">
                        {chef.niches.map((niche: string, index: number) => (
                            <View
                                key={niche}
                                className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${index % 3 === 0 ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30' : index % 3 === 1 ? 'bg-[#8B5E3C] border-[#8B5E3C]' : 'bg-[#FFA000] border-[#FFA000]'}`}
                            >
                                <Text className={`font-satoshi font-bold text-[12px] ${index % 3 === 0 ? 'text-[#4CAF50]' : 'text-white'}`}>
                                    {niche}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Videos Section */}
                <View className="px-6 mb-10">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px]">
                            {isRecipesLoading ? 'Loading videos...' : `${chefVideos.length} Videos Uploaded`}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ManageVideos')}>
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">Manage Videos</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {chefVideos.map((video: any) => (
                            <View key={video.id} className="w-[48%] mb-4 bg-white rounded-2xl p-1.5 border border-[#EEEEEE]">
                                <View className="relative">
                                    <Image
                                        source={video.media?.cover_image_url ? { uri: video.media.cover_image_url } : require('../../assets/images/egusi.png')}
                                        className="w-full h-28 rounded-[12px] mb-2"
                                        resizeMode="cover"
                                    />
                                    <View className="absolute top-2 right-2 bg-black/40 px-1.5 py-0.5 rounded-md">
                                        <Text className="text-white text-[8px] font-bold">12:24</Text>
                                    </View>
                                </View>
                                <Text className="text-[11px] font-satoshi font-bold text-[#424242] mb-0.5" numberOfLines={1}>{video.title}</Text>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Image
                                            source={chef.profile_picture?.url ? { uri: chef.profile_picture.url } : require('../../assets/images/3d_avatar_3.png')}
                                            className="w-4 h-4 rounded-full mr-1"
                                        />
                                        <Text className="text-[8px] font-satoshi text-[#9E9E9E]">{chef.name}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="share-social-outline" size={10} color="#4CAF50" />
                                    </View>
                                </View>
                                <View className="flex-row items-center justify-between mt-1">
                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">₦{Number(video.price).toLocaleString()}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UploadVideo')}
                        className="bg-[#4CAF50] h-14 rounded-2xl flex-row items-center justify-center mt-6"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px] mr-2">Post a Video</Text>
                        <Plus size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};
