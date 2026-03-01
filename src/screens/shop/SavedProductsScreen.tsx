import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import { useCartActions } from '../../hooks/useCartActions';
import { CartQuantityControl } from '../../components/CartQuantityControl';

export const SavedProductsScreen = ({ navigation }: any) => {
    const { getProductQuantity, incrementProduct, decrementProduct, isProductPending } = useCartActions();

    const {
        data: favoritesResponse,
        isLoading,
        isError,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['favorite-products'],
        queryFn: () => foodService.fetchFavoriteProducts(),
    });

    const favorites = favoritesResponse?.data || [];

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg"
                    >
                        <Ionicons name="arrow-back" size={18} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Saved Products</Text>
                    <View className="w-9 h-9" />
                </View>

                {isLoading || isRefetching ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : isError ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-[#9E9E9E] font-satoshi text-center mb-4">Could not load saved products.</Text>
                        <TouchableOpacity
                            onPress={() => refetch()}
                            className="bg-[#4CAF50] px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-satoshi font-bold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
                        numColumns={2}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                                className="w-[48%] mb-6"
                            >
                                <View className="relative">
                                    <View className="bg-white rounded-2xl overflow-hidden border border-gray-50 shadow-sm">
                                        <Image
                                            source={{ uri: item.media?.url || 'https://via.placeholder.com/160' }}
                                            className="w-full h-32"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute bottom-2 left-2 bg-white/80 px-2 py-0.5 rounded-md flex-row items-center">
                                            <Ionicons name="basket-outline" size={8} color="#424242" />
                                            <Text className="text-[#424242] text-[6px] font-bold ml-1">{item.stock || 0} Left</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="mt-3">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242] flex-1 mr-1" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242]">~₦{item.price?.toLocaleString() || '0'}</Text>
                                    </View>

                                    <CartQuantityControl
                                        quantity={getProductQuantity(item.id)}
                                        onAdd={() => incrementProduct(item.id)}
                                        onIncrement={() => incrementProduct(item.id)}
                                        onDecrement={() => decrementProduct(item.id)}
                                        loading={isProductPending(item.id)}
                                        compact
                                    />
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-12">
                                <Ionicons name="heart-dislike-outline" size={52} color="#E0E0E0" />
                                <Text className="text-[#9E9E9E] font-satoshi mt-3">No saved products yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};
