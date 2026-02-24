import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, TextInput, Linking, ActivityIndicator } from 'react-native';
import { Search, MapPin, Bell, ChevronRight, Star, ShoppingCart } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFoods } from '../../hooks/useFoods';
import { useQuery } from '@tanstack/react-query';
import { adService, Advertisement } from '../../utils/adService';

const CATEGORIES = [
    { id: '1', name: 'Vegetables' },
    { id: '2', name: 'Fruits' },
    { id: '3', name: 'Baby & Kids' },
    { id: '4', name: 'Proteins' },
    { id: '5', name: 'Baked Foods' },
];

export const HomeScreen = ({ navigation }: any) => {
    const [selectedCategory, setSelectedCategory] = useState('Fruits');

    const { data: foodData, isLoading: isFoodsLoading } = useFoods({
        categories: selectedCategory,
        per_page: 10
    });

    const { data: adsResponse, isLoading: isAdsLoading } = useQuery({
        queryKey: ['ads'],
        queryFn: () => adService.fetchAds(),
    });

    const foods = foodData?.data || [];
    const ads = adsResponse?.data?.data?.filter(ad => ad.is_active)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0)) || [];

    const handleAdPress = (ad: Advertisement) => {
        if (ad.target_url) {
            Linking.openURL(ad.target_url).catch(err => console.error('Error opening URL:', err));
        } else {
            navigation.navigate('RecommendedProducts'); // Default action
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

    const renderProductItem = (item: any, isRecommended = false) => (
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
                    <Text className="text-[#424242] text-[8px] font-bold ml-1">{item.baskets_left || 0} Baskets Left</Text>
                </View>
            </View>
            <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[13px] font-satoshi font-bold text-[#424242] flex-1" numberOfLines={1}>{item.name}</Text>
                <Text className="text-[14px] font-satoshi font-bold text-[#424242]">~₦{item.price?.toLocaleString() || '0'}</Text>
            </View>
            <TouchableOpacity className="bg-[#4CAF50] py-2.5 rounded-xl flex-row items-center justify-center">
                <Text className="text-white font-satoshi font-bold text-xs mr-2">Add to Cart</Text>
                <ShoppingCart size={14} color="white" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Text className="text-[#424242] font-satoshi font-bold text-[24px]">
                            Hello, Craig 👋
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

                {/* Search Bar */}
                <View className="px-6 mb-5">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Search')}
                        className="h-12 bg-white border border-[#EEEEEE] rounded-xl flex-row items-center px-4"
                    >
                        <Text className="flex-1 text-sm text-[#9E9E9E] font-satoshi">
                            Search for groceries, recipes etc
                        </Text>
                        <Search size={18} color="#9E9E9E" />
                    </TouchableOpacity>
                </View>

                {/* Main Banner (Ad 1) */}
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

                {/* Categories */}
                <View className="mb-6">
                    <FlatList
                        data={CATEGORIES}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSelectedCategory(item.name)}
                                className={`px-4 py-2 rounded-lg mr-2.5 border border-[#E0E0E0] ${selectedCategory === item.name ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white'}`}
                            >
                                <Text className={`font-satoshi font-bold text-[13px] ${selectedCategory === item.name ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                    />
                </View>

                {/* Featured Products (Rush Hour Offers) */}
                <View className="px-6 mb-8">
                    <Text className="text-[15px] font-satoshi font-bold text-[#9E9E9E] mb-3">Rush Hour Offers</Text>
                    {isFoodsLoading ? (
                        <ActivityIndicator color="#4CAF50" />
                    ) : (
                        <FlatList
                            data={foods.slice(0, 5)}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => renderProductItem(item)}
                            keyExtractor={(item) => item.id}
                        />
                    )}
                </View>

                {/* Recommended Section */}
                <View className="px-6 mb-10">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-[15px] font-satoshi font-bold text-[#9E9E9E]">Recommended</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('RecommendedProducts')}>
                            <Text className="text-[13px] font-satoshi font-bold text-[#4CAF50]">View all</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-row flex-wrap justify-between">
                        {isFoodsLoading ? (
                            <ActivityIndicator color="#4CAF50" className="mx-auto" />
                        ) : (
                            foods.map((product) => renderProductItem(product, true))
                        )}
                    </View>
                </View>

                {/* Second Banner (Ad 2) */}
                {ads.length > 1 ? (
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
                )}

                {/* Secondary Grid */}
                <View className="px-6 mb-20">
                    <View className="flex-row flex-wrap justify-between">
                        {foods.map((product) => renderProductItem(product, true))}
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};
