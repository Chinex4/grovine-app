import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart, Heart } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';

export const ProductDetailScreen = ({ route, navigation }: any) => {
    const { productId } = route.params || {};

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['food', productId],
        queryFn: () => foodService.fetchFoodById(productId),
        enabled: !!productId,
    });

    const product = response?.data;

    if (isLoading) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    if (error || !product) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-gray-500 font-satoshi text-center">
                        Failed to load product details. Please try again.
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mt-4 bg-[#4CAF50] px-6 py-2 rounded-lg"
                    >
                        <Text className="text-white font-bold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    {/* Header Image */}
                    <View className="relative mb-6">
                        <Image
                            source={{ uri: product.media?.url || 'https://via.placeholder.com/300' }}
                            className="w-full h-64 rounded-[24px]"
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm"
                        >
                            <Ionicons name="arrow-back" size={18} color="#424242" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm"
                        >
                            <Heart size={18} color="#424242" />
                        </TouchableOpacity>
                    </View>

                    {/* Product Info */}
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 mr-4">
                            <Text className="text-[22px] font-satoshi font-bold text-[#424242]">{product.name}</Text>
                            <View className="flex-row items-center mt-1">
                                <Ionicons name="basket-outline" size={14} color="#9E9E9E" />
                                <Text className="text-[12px] font-satoshi text-[#9E9E9E] ml-1">Available in stock</Text>
                            </View>
                        </View>
                        <Text className="text-[20px] font-satoshi font-bold text-[#424242]">~₦{product.price.toLocaleString()}</Text>
                    </View>

                    {/* Description Section */}
                    <View className="mt-6 pb-10">
                        <Text className="text-[#424242] font-satoshi font-bold text-[16px] mb-2">Description</Text>
                        <Text className="text-[#9E9E9E] font-satoshi text-[13px] leading-[20px]">
                            {product.description || 'No description available for this item.'}
                        </Text>
                    </View>
                </ScrollView>

                {/* Sticky Add to Cart Button */}
                <View className="px-6 py-6 bg-[#F7F7F7]">
                    <TouchableOpacity
                        onPress={() => {
                            // Logic for adding to cart
                            navigation.navigate('Orders');
                        }}
                        className="bg-[#4CAF50] h-12 rounded-xl flex-row items-center justify-center shadow-lg"
                    >
                        <Text className="text-white font-satoshi font-bold text-[14px] mr-2">Add to Cart</Text>
                        <ShoppingCart size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
