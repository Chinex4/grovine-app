import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, TextInput, Dimensions } from 'react-native';
import { Search, ShoppingCart, ChevronRight, Check } from 'lucide-react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SHOP_CATEGORIES = [
    'Vegetables', 'Fruits', 'Baby & Kids', 'Proteins', 'Grains',
    'Baked Foods', 'Beverages', 'Snacks & Treats', 'Frozen Foods',
    'House Essentials', 'Desserts & Sweetners', 'International Cuisines'
];

const SHOP_PRODUCTS = [
    { id: '1', name: 'Grape', price: '4,800.79', basketsLeft: 28, image: require('../../assets/images/red_grapes_basket.jpg') },
    { id: '2', name: 'Apple', price: '4,800.79', basketsLeft: 2, image: require('../../assets/images/red_apples_sliced.jpg') },
    { id: '3', name: 'Pineapple', price: '4,800.79', basketsLeft: 2, image: require('../../assets/images/pineapple_half_cut.jpg') },
    { id: '4', name: 'Kiwi', price: '4,800.79', basketsLeft: 2, image: require('../../assets/images/kiwi_sliced_bowl.jpg') },
    { id: '5', name: 'Kiwi', price: '4,800.79', basketsLeft: 2, image: require('../../assets/images/kiwi_sliced_bowl.jpg') },
    { id: '6', name: 'Pineapple', price: '4,800.79', basketsLeft: 2, image: require('../../assets/images/pineapple_half_cut.jpg') },
];

export const ShopScreen = ({ navigation }: any) => {
    const [isShoppingStarted, setIsShoppingStarted] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const renderProductItem = (item: any) => (
        <TouchableOpacity
            key={item.id}
            className="w-[48%] mb-4 bg-white rounded-2xl p-2 border border-[#EEEEEE]"
        >
            <View className="relative">
                <Image
                    source={item.image}
                    className="w-full h-32 rounded-[16px] mb-2"
                    resizeMode="cover"
                />
                <View className="absolute bottom-3 left-2.5 bg-white px-2 py-0.5 rounded-md flex-row items-center border border-gray-100">
                    <Ionicons name="basket-outline" size={10} color="#424242" />
                    <Text className="text-[#424242] text-[8px] font-bold ml-1">{item.basketsLeft} Baskets Left</Text>
                </View>
            </View>
            <View className="flex-row items-center justify-between mb-2 px-1">
                <Text className="text-[13px] font-satoshi font-bold text-[#424242] flex-1">{item.name}</Text>
                <Text className="text-[14px] font-satoshi font-bold text-[#424242]">~₦{item.price}</Text>
            </View>
            <TouchableOpacity className="bg-[#4CAF50] py-2.5 rounded-xl flex-row items-center justify-center">
                <Text className="text-white font-satoshi font-bold text-xs mr-2">Add to Cart</Text>
                <ShoppingCart size={14} color="white" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (!isShoppingStarted) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1">
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
                        <View className="pt-10 mb-6 flex-row items-center justify-between">
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
                            />
                            <Search size={18} color="#9E9E9E" />
                        </View>

                        <Text className="text-[14px] font-satoshi text-[#9E9E9E] mb-4">Choose one or more categories</Text>

                        <View className="flex-row flex-wrap mb-8">
                            {SHOP_CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => toggleCategory(cat)}
                                    className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${selectedCategories.includes(cat) ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'}`}
                                >
                                    <Text className={`font-satoshi font-bold text-[13px] ${selectedCategories.includes(cat) ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Brown Banner */}
                        <View className="mb-20">
                            <View className="bg-[#8B5E3C] h-40 rounded-[20px] overflow-hidden flex-row">
                                <View className="flex-1 items-center justify-center p-4">
                                    <Image
                                        source={require('../../assets/images/grocery_bag_illustration_2.jpg')}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                </View>
                                <View className="flex-1.5 justify-center pr-6">
                                    <Text className="text-white font-satoshi font-black text-[20px] leading-[24px] mb-1 uppercase">
                                        50% DISCOUNT
                                    </Text>
                                    <Text className="text-white font-satoshi font-bold text-[9px] leading-[12px] mb-3 uppercase">
                                        ON ALL VEGETABLE YOU BUY FROM{"\n"}DECEMBER 1ST TO JANUARY 28TH
                                    </Text>
                                    <TouchableOpacity className="bg-white py-1.5 px-6 rounded-lg self-start">
                                        <Text className="text-[#8B5E3C] font-satoshi font-bold text-[10px]">Order Now</Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="absolute bottom-3 right-3 opacity-30">
                                    <Ionicons name="ticket-outline" size={16} color="white" />
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Sticky Bottom Button */}
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
                <View className="pt-10 mb-6 flex-row items-center justify-between">
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
                    />
                    <Search size={18} color="#9E9E9E" />
                </View>

                {/* Selected Categories indicators */}
                <View className="mb-6">
                    <Text className="text-[12px] font-satoshi text-[#9E9E9E] mb-2">Selected categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {selectedCategories.map(cat => (
                            <View key={cat} className="bg-[#4CAF50] px-3 py-1.5 rounded-lg mr-2 flex-row items-center">
                                <Text className="text-white font-satoshi font-bold text-xs">{cat}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View className="flex-row flex-wrap justify-between mb-10">
                    {SHOP_PRODUCTS.map(product => renderProductItem(product))}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};
