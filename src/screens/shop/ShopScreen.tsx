import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Search, ShoppingCart } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { CategoryItem, foodService, FoodItem } from '../../utils/foodService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const getCategoryId = (product: FoodItem) => product.category_id || String(product.category?.id ?? '');

export const ShopScreen = ({ navigation }: any) => {
    const [isShoppingStarted, setIsShoppingStarted] = useState(false);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebouncedValue(searchQuery.trim(), 350);

    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: () => foodService.fetchCategoryOptions(),
    });

    const { data: productsResponse, isLoading: isProductsLoading } = useQuery({
        queryKey: ['shop-products', debouncedSearch],
        queryFn: () => (
            debouncedSearch.length > 0
                ? foodService.searchFoods(debouncedSearch)
                : foodService.fetchFoods({ per_page: 100 })
        ),
    });

    const categories = categoriesResponse?.data || [];
    const products = productsResponse?.data || [];

    const filteredProducts = useMemo(() => {
        if (selectedCategoryIds.length === 0) return products;
        return products.filter((product) => selectedCategoryIds.includes(getCategoryId(product)));
    }, [products, selectedCategoryIds]);

    const toggleCategory = (categoryId: string) => {
        setSelectedCategoryIds((prev) => (
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        ));
    };

    const getCategoryNameById = (categoryId: string) =>
        categories.find((item) => item.id === categoryId)?.name || 'Category';

    const renderProductItem = (item: FoodItem) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            className="w-[48%] mb-4 bg-white rounded-2xl p-2 border border-[#EEEEEE]"
        >
            <View className="relative">
                <Image
                    source={{ uri: item.media?.url || 'https://via.placeholder.com/160' }}
                    className="w-full h-32 rounded-[16px] mb-2"
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
            <TouchableOpacity className="bg-[#4CAF50] py-2.5 rounded-xl flex-row items-center justify-center">
                <Text className="text-white font-satoshi font-bold text-xs mr-2">Add to Cart</Text>
                <ShoppingCart size={14} color="white" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderBackButton = () => (
        <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg"
        >
            <Ionicons name="arrow-back" size={18} color="#424242" />
        </TouchableOpacity>
    );

    if (!isShoppingStarted) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
                        <View className="pt-10 mb-3">
                            {renderBackButton()}
                        </View>

                        <View className="mb-6 flex-row items-center justify-between">
                            <Text className="text-[24px] font-satoshi font-bold text-[#424242] flex-1 mr-4">
                                What Are You Looking To Shop Today?
                            </Text>
                            <Image
                                source={require('../../assets/images/shopping_assistant_badge.jpg')}
                                className="w-20 h-10 rounded-lg"
                                resizeMode="contain"
                            />
                        </View>

                        <View className="h-12 bg-white border border-[#EEEEEE] rounded-xl flex-row items-center px-4 mb-6">
                            <TextInput
                                placeholder="Search for groceries"
                                className="flex-1 text-sm text-[#424242] font-satoshi"
                                placeholderTextColor="#9E9E9E"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Search size={18} color="#9E9E9E" />
                        </View>

                        <Text className="text-[14px] font-satoshi text-[#9E9E9E] mb-4">Choose one or more categories</Text>

                        {isCategoriesLoading ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : (
                            <View className="flex-row flex-wrap mb-8">
                                {categories.map((cat: CategoryItem) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => toggleCategory(cat.id)}
                                        className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${selectedCategoryIds.includes(cat.id) ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'}`}
                                    >
                                        <Text className={`font-satoshi font-bold text-[13px] ${selectedCategoryIds.includes(cat.id) ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <View className="px-6 py-6 bg-white border-t border-[#EEEEEE]">
                        <TouchableOpacity
                            onPress={() => setIsShoppingStarted(true)}
                            className="bg-[#4CAF50] h-14 rounded-2xl flex-row items-center justify-center"
                        >
                            <Text className="text-white font-satoshi font-bold text-[16px] mr-2">Start Shopping</Text>
                            <Ionicons name="basket" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
                <View className="pt-10 mb-3">
                    {renderBackButton()}
                </View>

                <View className="mb-6 flex-row items-center justify-between">
                    <View className="flex-1 mr-4">
                        <Text className="text-[20px] font-satoshi font-bold text-[#424242] leading-[26px]">
                            Pick Everything You{"\n"}Love & Need
                        </Text>
                    </View>
                    <TouchableOpacity className="bg-[#4CAF50] px-3 py-1.5 rounded-lg flex-row items-center">
                        <Text className="text-white font-satoshi font-bold text-[10px] mr-1">View Shopping Cart</Text>
                        <ShoppingCart size={12} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="h-12 bg-white border border-[#EEEEEE] rounded-xl flex-row items-center px-4 mb-6">
                    <TextInput
                        placeholder="Search for groceries"
                        className="flex-1 text-sm text-[#424242] font-satoshi"
                        placeholderTextColor="#9E9E9E"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <Search size={18} color="#9E9E9E" />
                </View>

                <View className="mb-6">
                    <Text className="text-[12px] font-satoshi text-[#9E9E9E] mb-2">Selected categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedCategoryIds.length > 0 ? selectedCategoryIds.map((categoryId) => (
                            <View key={categoryId} className="bg-[#4CAF50] px-3 py-1.5 rounded-lg mr-2 flex-row items-center">
                                <Text className="text-white font-satoshi font-bold text-xs">{getCategoryNameById(categoryId)}</Text>
                            </View>
                        )) : (
                            <Text className="text-[#BDBDBD] font-satoshi text-xs">All categories selected</Text>
                        )}
                    </ScrollView>
                </View>

                {isProductsLoading ? (
                    <ActivityIndicator color="#4CAF50" />
                ) : (
                    <View className="flex-row flex-wrap justify-between mb-10">
                        {filteredProducts.length > 0 ? filteredProducts.map((product) => renderProductItem(product)) : (
                            <Text className="text-[#9E9E9E] font-satoshi">No products match your filters.</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
};
