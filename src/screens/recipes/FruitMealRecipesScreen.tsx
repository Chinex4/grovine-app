import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';

const FRUIT_RECIPES = [
    { id: '1', title: 'Fruit Salad', price: '4,800.79', image: require('../../assets/images/fruit_salad_recipes.png') },
    { id: '2', title: 'Fruit Salad', price: '4,800.79', image: require('../../assets/images/fruit_salad_recipes.png') },
    { id: '3', title: 'Fruit Salad', price: '4,800.79', image: require('../../assets/images/fruit_salad_recipes.png') },
];

export const FruitMealRecipesScreen = ({ navigation }: any) => {
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
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Fruit Meal Recipes</Text>
                    <View className="w-9" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    {FRUIT_RECIPES.map((recipe) => (
                        <View key={recipe.id} className="bg-white rounded-[24px] p-4 mb-6 border border-gray-50 shadow-sm">
                            <Image
                                source={recipe.image}
                                className="w-full h-56 rounded-[16px] mb-4"
                                resizeMode="cover"
                            />
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-[16px] font-satoshi font-bold text-[#424242]">{recipe.title}</Text>
                                <Text className="text-[16px] font-satoshi font-bold text-[#424242]">~₦{recipe.price}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('RecipeDetail')}
                                className="bg-[#4CAF50] h-12 rounded-xl flex-row items-center justify-center"
                            >
                                <Text className="text-white font-satoshi font-bold text-[14px] mr-2">Watch Recipe</Text>
                                <Ionicons name="videocam-outline" size={18} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <View className="h-10" />
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};
