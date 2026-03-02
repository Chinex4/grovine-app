import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RecipeIngredient, recipeService } from '../../utils/recipeService';

const FALLBACK_RECIPE_IMAGE = require('../../assets/images/shakshuka.png');

const ingredientLabel = (ingredient: RecipeIngredient) => {
    const text = ingredient.item_text || ingredient.name || 'Ingredient';
    const qty = Number(ingredient.cart_quantity || ingredient.quantity || 1);
    return qty > 1 ? `${qty} ${text}` : text;
};

export const RecipeIngredientsScreen = ({ route, navigation }: any) => {
    const { recipeId } = route.params || {};
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

    const queryClient = useQueryClient();

    const { data: recipeResponse, isLoading } = useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeService.getRecipeById(recipeId),
        enabled: !!recipeId,
    });

    const addIngredientsMutation = useMutation({
        mutationFn: (ingredientIds: string[]) =>
            recipeService.addIngredientsToCart(recipeId, ingredientIds, 1),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const recipe = recipeResponse?.data;

    const selectableIngredientIds = useMemo(() => {
        if (!recipe?.ingredients?.length) return [] as string[];
        return recipe.ingredients
            .filter((ingredient) => Boolean(ingredient.product_id || ingredient.product?.id))
            .map((ingredient) => ingredient.id);
    }, [recipe?.ingredients]);

    useEffect(() => {
        if (!recipe?.ingredients) return;
        setSelectedIngredients(selectableIngredientIds);
    }, [recipe?.ingredients, selectableIngredientIds]);

    const toggleIngredient = (id: string) => {
        if (!selectableIngredientIds.includes(id)) return;

        setSelectedIngredients((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            }
            return [...prev, id];
        });
    };

    const selectAll = () => {
        const areAllSelected =
            selectableIngredientIds.length > 0 &&
            selectableIngredientIds.every((id) => selectedIngredients.includes(id));

        setSelectedIngredients(areAllSelected ? [] : selectableIngredientIds);
    };

    const addToCart = async () => {
        if (!recipe) return;
        if (selectedIngredients.length === 0) {
            Toast.show({ type: 'error', text1: 'Select at least one ingredient' });
            return;
        }

        try {
            await addIngredientsMutation.mutateAsync(selectedIngredients);
            Toast.show({
                type: 'success',
                text1: 'Ingredients added to cart',
                text2: `${selectedIngredients.length} ingredient(s) selected`,
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Could not add ingredients',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
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

    const hasSelectableIngredients = selectableIngredientIds.length > 0;

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Recipe Detail</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                    <View className="px-6 pt-6">
                        <Image
                            source={recipe.media.cover_image_url ? { uri: recipe.media.cover_image_url } : FALLBACK_RECIPE_IMAGE}
                            className="w-full h-44 rounded-[20px]"
                            resizeMode="cover"
                        />
                    </View>

                    <View className="px-6 pt-6">
                        <Text className="text-[20px] font-satoshi font-bold text-[#424242] mb-2">{recipe.title}</Text>
                        <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px] mb-8">
                            {recipe.short_description || recipe.description}
                        </Text>

                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px]">Ingredients</Text>
                            <TouchableOpacity onPress={selectAll} disabled={!hasSelectableIngredients}>
                                <Text className={`font-satoshi font-bold text-[12px] ${hasSelectableIngredients ? 'text-[#4CAF50]' : 'text-[#BDBDBD]'}`}>
                                    {selectedIngredients.length === selectableIngredientIds.length && selectableIngredientIds.length > 0
                                        ? 'Deselect all'
                                        : 'Select all'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mb-10">
                            {recipe.ingredients.map((ingredient) => {
                                const isSelected = selectedIngredients.includes(ingredient.id);
                                const canSelect = selectableIngredientIds.includes(ingredient.id);

                                return (
                                    <TouchableOpacity
                                        key={ingredient.id}
                                        onPress={() => toggleIngredient(ingredient.id)}
                                        disabled={!canSelect}
                                        className="flex-row items-center mb-3"
                                    >
                                        <View
                                            className={`w-5 h-5 rounded-md items-center justify-center mr-3 border ${
                                                isSelected
                                                    ? 'bg-[#4CAF50] border-[#4CAF50]'
                                                    : canSelect
                                                        ? 'bg-white border-gray-300'
                                                        : 'bg-gray-100 border-gray-200'
                                            }`}
                                        >
                                            {isSelected ? <Ionicons name="checkmark" size={14} color="white" /> : null}
                                        </View>
                                        <Text
                                            className={`text-[14px] font-satoshi ${
                                                canSelect ? 'text-[#424242]' : 'text-[#BDBDBD]'
                                            }`}
                                        >
                                            {ingredientLabel(ingredient)}
                                            {!canSelect ? ' (not in store)' : ''}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px] mb-4">Instruction; How to cook</Text>
                        {recipe.instructions.length === 0 ? (
                            <Text className="text-[12px] font-satoshi text-[#9E9E9E]">No instructions available.</Text>
                        ) : (
                            recipe.instructions.map((step, index) => (
                                <View key={`${step.title}-${index}`} className="mb-6">
                                    <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-1">{step.title}</Text>
                                    <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px]">{step.content}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                <View className="px-6 py-6 absolute bottom-0 w-full bg-white border-t border-gray-50">
                    <TouchableOpacity
                        onPress={addToCart}
                        disabled={addIngredientsMutation.isPending || !hasSelectableIngredients}
                        className={`h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${
                            addIngredientsMutation.isPending || !hasSelectableIngredients ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'
                        }`}
                    >
                        {addIngredientsMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Text className="text-white font-satoshi font-bold text-[16px] mr-2">Add Ingredients to Cart</Text>
                                <ShoppingCart size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
