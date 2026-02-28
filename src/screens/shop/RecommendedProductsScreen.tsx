import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Search, ShoppingCart } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { CategoryItem, foodService, FoodItem } from '../../utils/foodService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const matchesCategory = (product: FoodItem, categoryId: string) =>
    product.category_id === categoryId || String(product.category?.id ?? '') === categoryId;

export const RecommendedProductsScreen = ({ navigation }: any) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [searchText, setSearchText] = useState('');
    const debouncedSearch = useDebouncedValue(searchText.trim().toLowerCase(), 300);

    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ['recommended-categories'],
        queryFn: () => foodService.fetchCategoryOptions(),
    });

    const { data: recommendedResponse, isLoading: isRecommendedLoading } = useQuery({
        queryKey: ['recommended-products-screen'],
        queryFn: () => foodService.fetchRecommendedProducts(),
    });

    const categories = categoriesResponse?.data || [];
    const recommendedProducts = recommendedResponse?.data || [];

    const filteredProducts = useMemo(() => {
        let output = recommendedProducts;

        if (selectedCategoryId) {
            output = output.filter((item) => matchesCategory(item, selectedCategoryId));
        }

        if (debouncedSearch.length > 0) {
            output = output.filter((item) => {
                const name = item.name?.toLowerCase() || '';
                const description = item.description?.toLowerCase() || '';
                return name.includes(debouncedSearch) || description.includes(debouncedSearch);
            });
        }

        return output;
    }, [recommendedProducts, selectedCategoryId, debouncedSearch]);

    const renderCategoryChip = (item: CategoryItem) => (
        <TouchableOpacity
            key={item.id}
            onPress={() => setSelectedCategoryId(item.id)}
            className={`px-4 py-2 rounded-lg mr-2 border ${selectedCategoryId === item.id ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'}`}
        >
            <Text className={`font-satoshi font-bold text-[13px] ${selectedCategoryId === item.id ? 'text-white' : 'text-[#9E9E9E]'}`}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 bg-white border-b border-gray-50">
                    <View className="flex-row items-center justify-between mb-4">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg"
                        >
                            <Ionicons name="arrow-back" size={18} color="#424242" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Recommended</Text>
                        <TouchableOpacity className="w-9 h-9 items-center justify-center">
                            <Ionicons name="grid-outline" size={20} color="#BDBDBD" />
                        </TouchableOpacity>
                    </View>

                    <View className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-3">
                        <TextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search recommended products"
                            className="flex-1 font-satoshi text-[14px] text-[#424242]"
                            placeholderTextColor="#9E9E9E"
                        />
                        <Search size={18} color="#9E9E9E" />
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            onPress={() => setSelectedCategoryId('')}
                            className={`px-4 py-2 rounded-lg mr-2 border ${selectedCategoryId === '' ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'}`}
                        >
                            <Text className={`font-satoshi font-bold text-[13px] ${selectedCategoryId === '' ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                All
                            </Text>
                        </TouchableOpacity>
                        {isCategoriesLoading ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : (
                            categories.map(renderCategoryChip)
                        )}
                    </ScrollView>
                </View>

                {isRecommendedLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredProducts}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
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

                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                        }}
                                        className="bg-[#4CAF50] h-10 rounded-xl flex-row items-center justify-center"
                                    >
                                        <Text className="text-white font-satoshi font-bold text-[10px] mr-2">Add to Cart</Text>
                                        <ShoppingCart size={12} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-12">
                                <Text className="text-[#9E9E9E] font-satoshi">No recommended products match this filter.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

