import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, FlatList, Image } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Search, Plus, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeService, Recipe } from '../../utils/recipeService';
import Toast from 'react-native-toast-message';

const STATUS_OPTIONS = [
    { key: '', label: 'All' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'PENDING_APPROVAL', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
];

const formatNaira = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return `₦${safe.toLocaleString()}`;
};

const getStatusColor = (status?: string) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'APPROVED') return '#2E7D32';
    if (normalized === 'PENDING_APPROVAL') return '#F57C00';
    if (normalized === 'REJECTED') return '#D32F2F';
    return '#616161';
};

export const ManageVideosScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('');

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(searchQuery), 350);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const {
        data: recipesResponse,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['chef-recipes', activeStatus, debouncedSearch],
        queryFn: () => recipeService.listMyRecipes(activeStatus || undefined, debouncedSearch.trim() || undefined),
    });

    const deleteRecipeMutation = useMutation({
        mutationFn: (id: string) => recipeService.deleteRecipe(id),
        onSuccess: async () => {
            Toast.show({ type: 'success', text1: 'Recipe deleted' });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['chef-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipes'] }),
            ]);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error?.response?.data?.message || error?.message || 'Could not delete recipe.',
            });
        },
    });

    const submitRecipeMutation = useMutation({
        mutationFn: (id: string) => recipeService.submitRecipe(id),
        onSuccess: async () => {
            Toast.show({ type: 'success', text1: 'Recipe submitted for approval' });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['chef-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipes'] }),
            ]);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Submit failed',
                text2: error?.response?.data?.message || error?.message || 'Could not submit recipe.',
            });
        },
    });

    const recipes = useMemo(() => recipesResponse?.data || [], [recipesResponse]);

    const renderCard = ({ item }: { item: Recipe }) => (
        <View className="w-[48%] mb-4 bg-white rounded-2xl p-2 border border-[#EEEEEE]">
            <Image
                source={item.media?.cover_image_url ? { uri: item.media.cover_image_url } : require('../../assets/images/egusi.png')}
                className="w-full h-28 rounded-xl mb-2"
                resizeMode="cover"
            />

            <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[12px] font-satoshi font-bold text-[#424242] flex-1 pr-2" numberOfLines={2}>
                    {item.title}
                </Text>
                <TouchableOpacity
                    onPress={() => deleteRecipeMutation.mutate(item.id)}
                    disabled={deleteRecipeMutation.isPending}
                    className="w-7 h-7 rounded-full bg-red-50 items-center justify-center"
                >
                    <Trash2 size={12} color="#F44336" />
                </TouchableOpacity>
            </View>

            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-1">
                {formatNaira(item.estimated_cost || item.price)}
            </Text>

            <View
                className="self-start px-2 py-1 rounded-md"
                style={{ backgroundColor: `${getStatusColor(item.status)}1A` }}
            >
                <Text className="text-[9px] font-satoshi font-bold" style={{ color: getStatusColor(item.status) }}>
                    {item.status || 'DRAFT'}
                </Text>
            </View>

            {item.status === 'DRAFT' || item.status === 'REJECTED' ? (
                <TouchableOpacity
                    onPress={() => submitRecipeMutation.mutate(item.id)}
                    disabled={submitRecipeMutation.isPending}
                    className="mt-2 self-start px-2.5 py-1 rounded-md bg-[#4CAF50]"
                >
                    <Text className="text-white font-satoshi font-bold text-[9px]">Submit</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Manage Videos</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('UploadVideo', { resetDraft: true })}>
                        <Plus size={20} color="#4CAF50" />
                    </TouchableOpacity>
                </View>

                <View className="px-6 pt-5">
                    <View className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-4">
                        <TextInput
                            placeholder="Search for videos"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 font-satoshi text-sm"
                            placeholderTextColor="#9E9E9E"
                        />
                        {isFetching ? <ActivityIndicator size="small" color="#4CAF50" /> : <Search size={18} color="#9E9E9E" />}
                    </View>

                    <FlatList
                        data={STATUS_OPTIONS}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.label}
                        contentContainerStyle={{ paddingBottom: 12 }}
                        renderItem={({ item }) => {
                            const active = activeStatus === item.key;
                            return (
                                <TouchableOpacity
                                    onPress={() => setActiveStatus(item.key)}
                                    className={`px-4 h-9 rounded-lg mr-2 border items-center justify-center ${
                                        active ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text className={`font-satoshi font-bold text-[11px] ${active ? 'text-white' : 'text-[#757575]'}`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <FlatList
                        data={recipes}
                        numColumns={2}
                        keyExtractor={(item) => item.id}
                        renderItem={renderCard}
                        columnWrapperStyle={{ justifyContent: 'space-between' }}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        onRefresh={refetch}
                        refreshing={isFetching}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center py-24">
                                <Text className="font-satoshi text-[13px] text-[#9E9E9E] mb-4">No recipes found.</Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('UploadVideo', { resetDraft: true })}
                                    className="px-4 h-10 rounded-lg bg-[#4CAF50] items-center justify-center"
                                >
                                    <Text className="font-satoshi font-bold text-[12px] text-white">Add New Recipe</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};
