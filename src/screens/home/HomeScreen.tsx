import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Linking, ActivityIndicator } from 'react-native';
import { Search } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adService, Advertisement } from '../../utils/adService';
import { userService } from '../../utils/userService';
import { CategoryItem, foodService, FoodItem } from '../../utils/foodService';
import { useCartActions } from '../../hooks/useCartActions';
import { CartQuantityControl } from '../../components/CartQuantityControl';

const matchesCategory = (product: FoodItem, categoryId: string) =>
    product.category_id === categoryId || String(product.category?.id ?? '') === categoryId;

const ALL_CATEGORY_ID = 'all';

export const HomeScreen = ({ navigation }: any) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORY_ID);
    const { getProductQuantity, incrementProduct, decrementProduct, isProductPending } = useCartActions();

    const { data: adsResponse, isLoading: isAdsLoading } = useQuery({
        queryKey: ['ads'],
        queryFn: () => adService.fetchAds(),
    });

    const { data: meResponse } = useQuery({
        queryKey: ['me'],
        queryFn: userService.getMe,
    });

    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => foodService.fetchCategoryOptions(),
    });

    const { data: recommendedResponse, isLoading: isRecommendedLoading } = useQuery({
        queryKey: ['home-recommended-products'],
        queryFn: () => foodService.fetchRecommendedProducts(),
    });

    const { data: rushOffersResponse, isLoading: isRushOffersLoading } = useQuery({
        queryKey: ['home-rush-hour-offers'],
        queryFn: () => foodService.fetchRushHourOffersWithFallback(),
    });

    const categories = categoriesResponse?.data || [];
    const recommendedProducts = recommendedResponse?.data || [];
    const rushHourOffers = rushOffersResponse?.data || [];
    const ads = adsResponse?.data?.data?.filter((ad) => ad.is_active)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)) || [];

    const categoriesWithAll = useMemo<CategoryItem[]>(() => (
        [{ id: ALL_CATEGORY_ID, name: 'All' } as CategoryItem, ...categories]
    ), [categories]);

    const filteredRushHourOffers = useMemo(() => {
        if (!selectedCategoryId || selectedCategoryId === ALL_CATEGORY_ID) return rushHourOffers;
        return rushHourOffers.filter((item) => matchesCategory(item, selectedCategoryId));
    }, [rushHourOffers, selectedCategoryId]);

    const filteredRecommendedProducts = useMemo(() => {
        if (!selectedCategoryId || selectedCategoryId === ALL_CATEGORY_ID) return recommendedProducts;
        return recommendedProducts.filter((item) => matchesCategory(item, selectedCategoryId));
    }, [recommendedProducts, selectedCategoryId]);

    const recommendedPrimary = filteredRecommendedProducts.slice(0, 4);
    const recommendedSecondary = filteredRecommendedProducts.slice(4);

    const userName = meResponse?.data?.name?.trim() || 'there';
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const handleAdPress = (ad: Advertisement) => {
        if (ad.target_url) {
            Linking.openURL(ad.target_url).catch(() => undefined);
        } else {
            navigation.navigate('RecommendedProducts');
        }
    };

    const renderAdBanner = (ad: Advertisement, index: number) => {
        const isAlternate = index % 2 !== 0;
        const bgColor = isAlternate ? '#8B5E3C' : '#F2994A';

        return (
            <TouchableOpacity
                key={ad.id}
                onPress={() => handleAdPress(ad)}
                className="px-6 mb-6"
            >
                <View
                    style={{ backgroundColor: bgColor }}
                    className="h-44 rounded-[24px] overflow-hidden flex-row"
                >
                    <View className="flex-[1.5] justify-center pl-6">
                        <Text className="text-white font-satoshi font-black text-[22px] leading-[26px] mb-1 uppercase" numberOfLines={2}>
                            {ad.title || 'GROVINE SPECIAL'}
                        </Text>
                        <Text className="text-white font-satoshi font-bold text-[11px] leading-[14px] mb-3 uppercase" numberOfLines={3}>
                            {ad.description || 'YOUR FOOD JOURNEY, REIMAGINED. START SHOPPING NOW!'}
                        </Text>
                        <View className="bg-white py-2 px-6 rounded-lg self-start">
                            <Text style={{ color: bgColor }} className="font-satoshi font-bold text-xs uppercase">Order Now</Text>
                        </View>
                    </View>
                    <View className="flex-1 relative justify-center items-center">
                        <Image
                            source={{ uri: ad.media.url }}
                            className="w-32 h-32 rounded-lg"
                            resizeMode="cover"
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderProductItem = (item: FoodItem, isRecommended = false) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            className={`${isRecommended ? 'w-[48%] mb-4' : 'w-[240px] mr-4'}`}
        >
            <View className="relative">
                <Image
                    source={{ uri: item.media?.url || 'https://via.placeholder.com/150' }}
                    className={`w-full ${isRecommended ? 'h-32' : 'h-36'} rounded-[16px] mb-2`}
                    resizeMode="cover"
                />
                <View className="absolute bottom-3 left-2.5 bg-white px-2 py-0.5 rounded-md flex-row items-center border border-gray-100">
                    <Ionicons name="basket-outline" size={10} color="#424242" />
                    <Text className="text-[#424242] text-[8px] font-bold ml-1">{item.stock || 0} Left</Text>
                </View>
            </View>
            <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[13px] font-satoshi font-bold text-[#424242] flex-1" numberOfLines={1}>{item.name}</Text>
                <Text className="text-[14px] font-satoshi font-bold text-[#424242]">~₦{item.price?.toLocaleString() || '0'}</Text>
            </View>
            <CartQuantityControl
                quantity={getProductQuantity(item.id)}
                onAdd={() => incrementProduct(item.id)}
                onIncrement={() => incrementProduct(item.id)}
                onDecrement={() => decrementProduct(item.id)}
                loading={isProductPending(item.id)}
                compact
            />
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-[#424242] font-satoshi font-bold text-[24px]">
                            Hello, {userName} 👋
                        </Text>
                        <Text className="text-[#9E9E9E] font-satoshi text-[13px] mt-0.5">
                            {timeGreeting}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        className="w-10 h-10 items-center justify-center"
                    >
                        <Ionicons name="notifications-outline" size={24} color="#424242" />
                        <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#F2994A] rounded-full border-2 border-white" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 mb-5">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SearchHistory')}
                        className="h-12 bg-white border border-[#EEEEEE] rounded-xl flex-row items-center px-4"
                    >
                        <Text className="flex-1 text-sm text-[#9E9E9E] font-satoshi">
                            Search for groceries, recipes etc
                        </Text>
                        <Search size={18} color="#9E9E9E" />
                    </TouchableOpacity>
                </View>

                {isAdsLoading ? (
                    <View className="px-6 mb-6">
                        <View className="bg-gray-200 h-40 rounded-[24px] items-center justify-center">
                            <ActivityIndicator color="#4CAF50" />
                        </View>
                    </View>
                ) : ads.length > 0 ? (
                    renderAdBanner(ads[0], 0)
                ) : (
                    <View className="px-6 mb-6">
                        <View className="bg-[#F2994A] h-40 rounded-[20px] overflow-hidden flex-row">
                            <View className="flex-[1.5] justify-center pl-6">
                                <Text className="text-white font-satoshi font-black text-[22px] leading-[26px] mb-1 uppercase">
                                    50% DISCOUNT
                                </Text>
                                <Text className="text-white font-satoshi font-bold text-[11px] leading-[14px] mb-3 uppercase">
                                    ON ALL VEGETABLE YOU BUY FROM{"\n"}DECEMBER 1ST TO JANUARY 28TH
                                </Text>
                                <TouchableOpacity className="bg-white py-2 px-6 rounded-lg self-start">
                                    <Text className="text-[#F2994A] font-satoshi font-bold text-xs">Order Now</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="flex-1 relative overflow-visible">
                                <Image
                                    source={require('../../assets/images/grocery_banner_illustrator_1771719139358.jpg')}
                                    className="w-32 h-32 absolute -right-2 top-4"
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </View>
                )}

                <View className="mb-6">
                    {isCategoriesLoading ? (
                        <ActivityIndicator color="#4CAF50" />
                    ) : (
                        <FlatList
                            data={categoriesWithAll}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                            renderItem={({ item }: { item: CategoryItem }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedCategoryId(item.id)}
                                    className={`px-4 py-2 rounded-lg mr-2.5 border border-[#E0E0E0] ${selectedCategoryId === item.id ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white'}`}
                                >
                                    <Text className={`font-satoshi font-bold text-[13px] ${selectedCategoryId === item.id ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </View>

                <View className="px-6 mb-8">
                    <Text className="text-[15px] font-satoshi font-bold text-[#9E9E9E] mb-3">Rush Hour Offers</Text>
                    {isRushOffersLoading ? (
                        <ActivityIndicator color="#4CAF50" />
                    ) : (
                        <FlatList
                            data={filteredRushHourOffers.slice(0, 8)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => renderProductItem(item)}
                            keyExtractor={(item) => item.id}
                            ListEmptyComponent={
                                <Text className="text-[#9E9E9E] font-satoshi">No products found for this category.</Text>
                            }
                        />
                    )}
                </View>

                <View className="px-6 mb-10">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[15px] font-satoshi font-bold text-[#9E9E9E]">Recommended</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('RecommendedProducts')}>
                            <Text className="text-[13px] font-satoshi font-bold text-[#4CAF50]">View all</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap justify-between">
                        {isRecommendedLoading ? (
                            <ActivityIndicator color="#4CAF50" className="mx-auto" />
                        ) : filteredRecommendedProducts.length === 0 ? (
                            <Text className="text-[#9E9E9E] font-satoshi">No products found for this category.</Text>
                        ) : (
                            recommendedPrimary.map((product) => renderProductItem(product, true))
                        )}
                    </View>
                </View>

                {filteredRecommendedProducts.length > 0 && (
                    ads.length > 1 ? (
                        renderAdBanner(ads[1], 1)
                    ) : (
                        <View className="px-6 mb-10">
                            <View className="bg-[#8B5E3C] h-44 rounded-[24px] overflow-hidden flex-row">
                                <View className="flex-1 items-center justify-center p-4">
                                    <Image
                                        source={require('../../assets/images/grocery_bag_illustration_2.jpg')}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                </View>
                                <View className="flex-1.5 justify-center pr-6">
                                    <Text className="text-white font-satoshi font-black text-[24px] leading-[28px] mb-1 uppercase">
                                        50% DISCOUNT
                                    </Text>
                                    <Text className="text-white font-satoshi font-bold text-[11px] leading-[14px] mb-4 uppercase">
                                        ON ALL VEGETABLE YOU BUY{"\n"}FROM DECEMBER 1ST TO{"\n"}JANUARY 28TH
                                    </Text>
                                    <TouchableOpacity className="bg-[#FAF9F6] py-2 px-8 rounded-lg self-center">
                                        <Text className="text-[#8B5E3C] font-satoshi font-bold text-sm">Order Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )
                )}

                {recommendedSecondary.length > 0 && (
                    <View className="px-6 mb-10">
                        <View className="flex-row flex-wrap justify-between">
                            {recommendedSecondary.map((product) => renderProductItem(product, true))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};
