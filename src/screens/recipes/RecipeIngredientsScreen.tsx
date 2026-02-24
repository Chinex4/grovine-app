import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { recipeService } from '../../utils/recipeService';

export const RecipeIngredientsScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

    const { data: recipeResponse, isLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const recipe = recipeResponse?.data;

    useEffect(() => {
        if (recipe?.ingredients) {
            // Initially select all
            setSelectedIngredients(recipe.ingredients.map(ing => ing.id));
        }
    }, [recipe]);

    const toggleIngredient = (id: string) => {
        if (selectedIngredients.includes(id)) {
            setSelectedIngredients(selectedIngredients.filter(i => i !== id));
        } else {
            setSelectedIngredients([...selectedIngredients, id]);
        }
    };

    const selectAll = () => {
        if (recipe) {
            const allSelected = selectedIngredients.length === recipe.ingredients.length;
            setSelectedIngredients(allSelected ? [] : recipe.ingredients.map(ing => ing.id));
        }
    };

    if (isLoading) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    if (!recipe) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <Text>Recipe not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 bg-[#4CAF50] px-4 py-2 rounded-lg">
                        <Text className="text-white">Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Recipe Detail</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    {/* Header Image */}
                    <View className="px-6 pt-6">
                        <Image
                            source={recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : require('../../assets/images/shakshuka.png')}
                            className="w-full h-44 rounded-[20px]"
                            resizeMode="cover"
                        />
                    </View>

                    {/* Content Section */}
                    <View className="px-6 pt-6 mb-24">
                        <Text className="text-[20px] font-satoshi font-bold text-[#424242] mb-2">{recipe.title}</Text>
                        <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px] mb-8">
                            {recipe.description}
                        </Text>

                        {/* Ingredients Checklist */}
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px]">Ingredients</Text>
                            <TouchableOpacity onPress={selectAll}>
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">
                                    {selectedIngredients.length === recipe.ingredients.length ? 'Deselect all' : 'Select all'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mb-10">
                            {recipe.ingredients.map((ing) => (
                                <TouchableOpacity
                                    key={ing.id}
                                    onPress={() => toggleIngredient(ing.id)}
                                    className="flex-row items-center mb-4"
                                >
                                    <View className={`w-5 h-5 rounded-md items-center justify-center mr-3 border ${selectedIngredients.includes(ing.id) ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-gray-200'}`}>
                                        {selectedIngredients.includes(ing.id) && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                    <Text className={`text-[14px] font-satoshi ${selectedIngredients.includes(ing.id) ? 'text-[#424242] font-bold' : 'text-[#9E9E9E]'}`}>
                                        {ing.quantity} {ing.name || 'Ingredient'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Instructions */}
                        <Text className="text-[#424242] font-satoshi font-bold text-[14px] mb-6">Instruction; How to cook</Text>
                        {recipe.instructions.map((step, index) => (
                            <View key={index} className="mb-6">
                                <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-1">{step.title}</Text>
                                <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px]">{step.content}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {/* Sticky Global Button */}
                <View className="px-6 py-6 absolute bottom-0 w-full bg-white border-t border-gray-50">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Orders')} // In future, wire up to CartService
                        className="bg-[#4CAF50] h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px] mr-2">Add Ingredients to Cart</Text>
                        <ShoppingCart size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
