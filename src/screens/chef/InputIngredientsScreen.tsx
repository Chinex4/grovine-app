import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [customIngredient, setCustomIngredient] = useState('');
    const [selectedItems, setSelectedItems] = useState<RecipeIngredient[]>(draftIngredients);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['food-search', debouncedSearch],
        queryFn: () => foodService.searchFoods(debouncedSearch),
        enabled: debouncedSearch.trim().length > 1,
    });

    const items = searchResults?.data || [];

    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    const filteredItems = useMemo(() => {
        if (!normalizedSearch) return [];
        return items.filter((item: any) => item?.name?.toLowerCase().includes(normalizedSearch));
    }, [items, normalizedSearch]);

    const addIngredientFromProduct = (item: any) => {
        const exists = selectedItems.some((i) => i.product_id === item.id || i.id === item.id);
        if (exists) {
            Toast.show({ type: 'info', text1: 'Already added' });
            return;
        }

        const nextItem: RecipeIngredient = {
            id: String(item.id),
            name: item.name,
            item_text: item.name,
            product_id: String(item.id),
            quantity: '1',
            is_optional: false,
        };

        setSelectedItems((prev) => [...prev, nextItem]);
        setSearchQuery('');
    };

    const addCustomIngredient = () => {
        const text = customIngredient.trim();
        if (!text) return;

        const exists = selectedItems.some((i) => (i.item_text || i.name || '').toLowerCase() === text.toLowerCase());
        if (exists) {
            Toast.show({ type: 'info', text1: 'Already added' });
            return;
        }

        const nextItem: RecipeIngredient = {
            id: `custom-${Date.now()}`,
            name: text,
            item_text: text,
            quantity: '1',
            is_optional: false,
        };

        setSelectedItems((prev) => [...prev, nextItem]);
        setCustomIngredient('');
    };

    const removeIngredient = (id: string) => {
        setSelectedItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateIngredient = (id: string, patch: Partial<RecipeIngredient>) => {
        setSelectedItems((prev) => prev.map((ingredient) => (ingredient.id === id ? { ...ingredient, ...patch } : ingredient)));
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

        const invalid = selectedItems.some((item) => !(item.item_text || item.name)?.trim());
        if (invalid) {
            Toast.show({
                type: 'error',
                text1: 'Invalid ingredient',
                text2: 'Each ingredient must have a name.',
            });
            return;
        }

        dispatch(setDraftIngredients(selectedItems));
        navigation.navigate('CookingSteps');
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1">
                    <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Input Ingredients</Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        className="flex-1 px-6 pt-8"
                        contentContainerStyle={{ paddingBottom: 16 }}
                    >
                        <View className="h-14 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-2">
                            <TextInput
                                placeholder="Search for ingredients"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="flex-1 font-satoshi text-sm text-[#424242]"
                                placeholderTextColor="#BDBDBD"
                            />
                            {isLoading ? <ActivityIndicator size="small" color="#4CAF50" /> : <Search size={18} color="#BDBDBD" />}
                        </View>

                        {debouncedSearch.trim().length > 1 && filteredItems.length > 0 ? (
                            <View className="bg-white border border-gray-100 rounded-xl mb-6 shadow-sm">
                                {filteredItems.slice(0, 8).map((item: any) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => addIngredientFromProduct(item)}
                                        className="px-4 py-3 border-b border-gray-50 flex-row items-center justify-between"
                                    >
                                        <Text className="font-satoshi text-sm text-[#424242]">{item.name}</Text>
                                        <Plus size={16} color="#4CAF50" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 justify-center mr-3">
                                <TextInput
                                    placeholder="Or add custom ingredient"
                                    value={customIngredient}
                                    onChangeText={setCustomIngredient}
                                    className="font-satoshi text-sm text-[#424242]"
                                    placeholderTextColor="#BDBDBD"
                                />
                            </View>
                            <TouchableOpacity
                                onPress={addCustomIngredient}
                                className="h-12 px-4 rounded-xl bg-[#4CAF50] items-center justify-center"
                            >
                                <Text className="text-white font-satoshi font-bold text-[12px]">Add</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px] mb-4">Selected Ingredients</Text>
                        {selectedItems.map((ingredient) => (
                            <View key={ingredient.id} className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <View className="flex-row items-center justify-between mb-3">
                                    <TextInput
                                        value={ingredient.item_text || ingredient.name}
                                        onChangeText={(text) => updateIngredient(ingredient.id, { item_text: text, name: text })}
                                        className="flex-1 mr-4 font-satoshi font-bold text-sm text-[#424242]"
                                        placeholder="Ingredient name"
                                        placeholderTextColor="#BDBDBD"
                                    />
                                    <TouchableOpacity onPress={() => removeIngredient(ingredient.id)}>
                                        <X size={18} color="#FF5252" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row items-center justify-between">
                                    <View className="h-9 w-24 bg-white border border-gray-100 rounded-lg px-2 justify-center">
                                        <TextInput
                                            placeholder="Qty"
                                            value={ingredient.quantity}
                                            onChangeText={(text) => updateIngredient(ingredient.id, { quantity: text.replace(/[^0-9]/g, '') })}
                                            keyboardType="number-pad"
                                            className="font-satoshi text-xs text-[#424242] text-center"
                                            placeholderTextColor="#BDBDBD"
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => updateIngredient(ingredient.id, { is_optional: !ingredient.is_optional })}
                                        className="flex-row items-center"
                                    >
                                        <Ionicons
                                            name={ingredient.is_optional ? 'checkbox' : 'square-outline'}
                                            size={18}
                                            color={ingredient.is_optional ? '#4CAF50' : '#9E9E9E'}
                                        />
                                        <Text className="ml-2 font-satoshi text-[12px] text-[#757575]">Optional</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <View className="h-16" />
                    </ScrollView>

                    <View className="px-6 py-6 border-t border-gray-50 bg-white">
                        <TouchableOpacity onPress={handleNext} className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center">
                            <Text className="text-white font-satoshi font-bold text-[16px]">Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
