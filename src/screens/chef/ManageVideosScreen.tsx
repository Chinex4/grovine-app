import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Search, Share2 } from 'lucide-react-native';

const CHEF_VIDEOS = [
    { id: '1', title: 'Egusi Soup With Chicken', price: '20,000', rating: '5.0', image: require('../../assets/images/egusi.png') },
    { id: '2', title: 'Egusi Soup With Chicken', price: '20,000', rating: '5.0', image: require('../../assets/images/egusi.png') },
    { id: '3', title: 'Egusi Soup With Chicken', price: '20,000', rating: '5.0', image: require('../../assets/images/egusi.png') },
];

export const ManageVideosScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Manage Videos</Text>
                    <TouchableOpacity>
                        <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">Select</Text>
                    </TouchableOpacity>
                </View>

                <View className="px-6 mt-4">
                    <View className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-6">
                        <TextInput
                            placeholder="Search for videos"
                            className="flex-1 font-satoshi text-sm"
                            placeholderTextColor="#9E9E9E"
                        />
                        <Search size={18} color="#9E9E9E" />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="flex-row flex-wrap justify-between">
                            {CHEF_VIDEOS.map((video) => (
                                <View key={video.id} className="w-[48%] mb-6">
                                    <View className="relative">
                                        <Image
                                            source={video.image}
                                            className="w-full h-32 rounded-2xl mb-2"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute top-2 right-2 bg-black/40 px-1.5 py-0.5 rounded-md">
                                            <Text className="text-white text-[8px] font-bold">12:24</Text>
                                        </View>
                                    </View>
                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-1">{video.title}</Text>
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center">
                                            <Image source={require('../../assets/images/3d_avatar_3.png')} className="w-4 h-4 rounded-full mr-1" />
                                            <Text className="text-[8px] font-satoshi text-[#9E9E9E]">Craig Orisa</Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <Share2 size={10} color="#4CAF50" />
                                        </View>
                                    </View>
                                    <View className="flex-row items-center justify-between mt-1">
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242]">₦{video.price}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </ScreenWrapper>
    );
};
