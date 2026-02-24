import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart, Bookmark } from 'lucide-react-native';

const SAVED_RECIPES = [
    { id: '1', title: 'Egusi Soup With Chicken', price: '20,000', chef: 'Chef Richard Nduh', rating: '4.5', image: require('../../assets/images/egusi.png') },
    { id: '2', title: 'Egusi Soup With Chicken', price: '20,000', chef: 'Chef Richard Nduh', rating: '4.5', image: require('../../assets/images/egusi.png') },
];

export const SavedRecipesScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Saved Recipes</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    {SAVED_RECIPES.map((recipe) => (
                        <View
                            key={recipe.id}
                            className="bg-white rounded-[24px] overflow-hidden mb-6 border border-gray-50 shadow-sm"
                        >
                            <View className="relative">
                                <Image source={recipe.image} className="w-full h-48" resizeMode="cover" />
                                <View className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded-md">
                                    <Text className="text-white text-[10px] font-bold">15:09</Text>
                                </View>
                            </View>
                            <View className="p-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-[14px] font-satoshi font-bold text-[#424242]">{recipe.title}</Text>
                                    <Text className="text-[14px] font-satoshi font-bold text-[#424242]">₦{recipe.price}</Text>
                                </View>

                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center">
                                        <Image source={require('../../assets/images/3d_avatar_3.png')} className="w-5 h-5 rounded-full mr-2" />
                                        <View>
                                            <Text className="text-[10px] font-satoshi font-bold text-[#424242]">{recipe.chef}</Text>
                                            <View className="flex-row items-center">
                                                <View className="bg-[#FFA000] w-2 h-2 rounded-full mr-1 items-center justify-center">
                                                    <Ionicons name="star" size={6} color="white" />
                                                </View>
                                                <Text className="text-[8px] font-satoshi text-[#9E9E9E]">{recipe.rating} Rating</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <TouchableOpacity>
                                        <Bookmark size={18} color="#BDBDBD" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    className="bg-[#4CAF50] h-12 rounded-xl flex-row items-center justify-center"
                                >
                                    <Text className="text-white font-satoshi font-bold text-[12px] mr-2">Add Ingredients to Cart</Text>
                                    <ShoppingCart size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
