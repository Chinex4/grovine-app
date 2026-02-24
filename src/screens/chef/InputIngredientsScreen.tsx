import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Search, Plus, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDraftIngredients, RecipeIngredient } from '../../store/slices/recipeSlice';
import { useQuery } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import Toast from 'react-native-toast-message';

export const InputIngredientsScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const draftIngredients = useSelector((state: RootState) => state.recipe.draft.ingredients);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<RecipeIngredient[]>(draftIngredients);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['food-search', searchQuery],
        queryFn: () => foodService.fetchFoodItems({ name: searchQuery }),
        enabled: searchQuery.length > 2,
    });

    const items = searchResults?.data || [];

    const addIngredient = (item: any) => {
        if (selectedItems.find(i => i.id === item.id)) {
            Toast.show({ type: 'info', text1: 'Already added' });
            return;
        }
        setSelectedItems([...selectedItems, { id: item.id, name: item.name, quantity: '1' }]);
        setSearchQuery('');
    };

    const removeIngredient = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, qty: string) => {
        setSelectedItems(selectedItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
    };

    const handleNext = () => {
        if (selectedItems.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please add at least one ingredient',
            });
            return;
        }
        dispatch(setDraftIngredients(selectedItems));
        navigation.navigate('CookingSteps');
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Input Ingredients</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-8">
                    <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-2">
                        <TextInput
                            placeholder="Search for ingredients"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 font-satoshi text-sm text-[#424242]"
                            placeholderTextColor="#BDBDBD"
                        />
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <Search size={18} color="#BDBDBD" />
                        )}
                    </View>

                    {/* Search Results */}
                    {searchQuery.length > 2 && items.length > 0 && (
                        <View className="bg-white border border-gray-100 rounded-xl mb-6 shadow-sm">
                            {items.map((item: any) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => addIngredient(item)}
                                    className="px-4 py-3 border-b border-gray-50 flex-row items-center justify-between"
                                >
                                    <Text className="font-satoshi text-sm text-[#424242]">{item.name}</Text>
                                    <Plus size={16} color="#4CAF50" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Selected Ingredients List */}
                    <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px] mt-6 mb-4">Selected Ingredients</Text>
                    {selectedItems.map((ing) => (
                        <View key={ing.id} className="flex-row items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl">
                            <View className="flex-1 mr-4">
                                <Text className="font-satoshi font-bold text-sm text-[#424242]">{ing.name}</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="h-8 w-20 bg-white border border-gray-100 rounded-lg px-2 justify-center mr-3">
                                    <TextInput
                                        placeholder="Qty"
                                        value={ing.quantity}
                                        onChangeText={(text) => updateQuantity(ing.id, text)}
                                        className="font-satoshi text-xs text-[#424242] text-center"
                                        placeholderTextColor="#BDBDBD"
                                    />
                                </View>
                                <TouchableOpacity onPress={() => removeIngredient(ing.id)}>
                                    <X size={18} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View className="px-6 py-6 border-t border-gray-50 bg-white">
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
