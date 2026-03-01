import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Heart } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import Toast from 'react-native-toast-message';
import { useCartActions } from '../../hooks/useCartActions';
import { CartQuantityControl } from '../../components/CartQuantityControl';

export const ProductDetailScreen = ({ route, navigation }: any) => {
    const { productId } = route.params || {};
    const queryClient = useQueryClient();
    const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
    const { getProductQuantity, incrementProduct, decrementProduct, isProductPending } = useCartActions();

    useEffect(() => {
        setFavoriteOverride(null);
    }, [productId]);

    const { data: response, isLoading, error } = useQuery({
        queryKey: ['food', productId],
        queryFn: () => foodService.fetchFoodById(productId),
        enabled: !!productId,
    });

    const { data: favoritesResponse } = useQuery({
        queryKey: ['favorite-products'],
        queryFn: () => foodService.fetchFavoriteProducts(),
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: () => foodService.toggleProductFavorite(productId),
        onSuccess: async (result) => {
            setFavoriteOverride(result.data.is_favorited);
            await queryClient.invalidateQueries({ queryKey: ['favorite-products'] });
            Toast.show({
                type: 'success',
                text1: result.data.is_favorited ? 'Product saved' : 'Product removed',
            });
        },
        onError: (mutationError: any) => {
            Toast.show({
                type: 'error',
                text1: 'Could not update saved product',
                text2: mutationError?.response?.data?.message || mutationError?.message || 'Please try again.',
            });
        },
    });

    const product = response?.data;
    const favoritedProductIds = useMemo(() => {
        const items = favoritesResponse?.data || [];
        return new Set(items.map((item) => item.id));
    }, [favoritesResponse]);

    const isFavorited = favoriteOverride ?? favoritedProductIds.has(String(productId || ''));

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
                            onPress={() => toggleFavoriteMutation.mutate()}
                            disabled={toggleFavoriteMutation.isPending}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white items-center justify-center shadow-sm"
                        >
                            <Heart
                                size={18}
                                color={isFavorited ? '#E53935' : '#424242'}
                                fill={isFavorited ? '#E53935' : 'transparent'}
                            />
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
                    <CartQuantityControl
                        quantity={getProductQuantity(product.id)}
                        onAdd={() => incrementProduct(product.id)}
                        onIncrement={() => incrementProduct(product.id)}
                        onDecrement={() => decrementProduct(product.id)}
                        loading={isProductPending(product.id)}
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};
