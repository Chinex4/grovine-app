import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart } from 'lucide-react-native';

const RECOMMENDED_PRODUCTS = [
    {
        id: '1',
        name: 'Grape',
        price: '4,800.79',
        basketsLeft: 28,
        image: require('../../assets/images/shakshuka.png'), // Reusing shaksuka for now as placeholder or use product images
    },
    {
        id: '2',
        name: 'Apple',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '3',
        name: 'Pineapple',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '4',
        name: 'Kiwi',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '5',
        name: 'Grape',
        price: '4,800.79',
        basketsLeft: 28,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '6',
        name: 'Kiwi',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '7',
        name: 'Apple',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
    {
        id: '8',
        name: 'Pineapple',
        price: '4,800.79',
        basketsLeft: 2,
        image: require('../../assets/images/apple_delight.png'),
    },
];

export const RecommendedProductsScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
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

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    <View className="flex-row flex-wrap justify-between pb-10">
                        {RECOMMENDED_PRODUCTS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => navigation.navigate('ProductDetail')}
                                className="w-[48%] mb-6"
                            >
                                <View className="relative">
                                    <View className="bg-white rounded-2xl overflow-hidden border border-gray-50 shadow-sm">
                                        <Image
                                            source={item.image}
                                            className="w-full h-32"
                                            resizeMode="cover"
                                        />
                                        <View className="absolute bottom-2 left-2 bg-white/80 px-2 py-0.5 rounded-md flex-row items-center">
                                            <Ionicons name="basket-outline" size={8} color="#424242" />
                                            <Text className="text-[#424242] text-[6px] font-bold ml-1">{item.basketsLeft} Baskets Left</Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="mt-3">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242]">{item.name}</Text>
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242]">~₦{item.price}</Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            navigation.navigate('Orders');
                                        }}
                                        className="bg-[#4CAF50] h-10 rounded-xl flex-row items-center justify-center"
                                    >
                                        <Text className="text-white font-satoshi font-bold text-[10px] mr-2">Add to Cart</Text>
                                        <ShoppingCart size={12} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
