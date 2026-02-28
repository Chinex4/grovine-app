import React from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ArrowUpRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { foodService } from '../../utils/foodService';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const HISTORY = [
    'Grape',
    'Rice',
    'Quaker Oats',
    'Abacha',
    'Yellow Apple',
];

export const SearchScreen = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const debouncedQuery = useDebouncedValue(searchQuery.trim(), 350);

    const { data: categoriesResponse } = useQuery({
        queryKey: ['search-categories'],
        queryFn: () => foodService.fetchCategoryOptions(),
    });

    const { data: legacySearchResponse, isFetching } = useQuery({
        queryKey: ['legacy-search', debouncedQuery],
        queryFn: () => foodService.searchLegacyFoods(debouncedQuery),
        enabled: debouncedQuery.length > 1,
    });

    const suggestions = categoriesResponse?.data?.slice(0, 6).map((category) => category.name) || [];
    const liveResults = legacySearchResponse?.data || [];
    const showLiveResults = debouncedQuery.length > 1;

    const handleSearch = () => {
        const trimmed = searchQuery.trim();
        if (trimmed) {
            navigation.navigate('SearchResults', { query: trimmed });
        }
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1 px-6 pt-10">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg mr-3"
                    >
                        <Ionicons name="arrow-back" size={18} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Search</Text>
                    <View className="w-9 h-9" />
                </View>

                <View className="flex-row items-center mb-8">
                    <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-4 h-12">
                        <TextInput
                            placeholder="Search for groceries, recipes etc"
                            className="flex-1 font-satoshi text-[14px] text-[#424242]"
                            placeholderTextColor="#BDBDBD"
                            autoFocus
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        <TouchableOpacity onPress={handleSearch}>
                            <Ionicons name="search-outline" size={18} color="#BDBDBD" />
                        </TouchableOpacity>
                    </View>
                </View>

                {showLiveResults ? (
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-[#9E9E9E] font-satoshi font-bold text-[12px]">Quick Results</Text>
                            <TouchableOpacity onPress={handleSearch}>
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">View all</Text>
                            </TouchableOpacity>
                        </View>

                        {isFetching ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : (
                            <FlatList
                                data={liveResults}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                                        className="flex-row items-center py-3 border-b border-gray-100"
                                    >
                                        <Image
                                            source={{ uri: item.media?.url || 'https://via.placeholder.com/80' }}
                                            className="w-12 h-12 rounded-lg mr-3"
                                        />
                                        <View className="flex-1">
                                            <Text className="font-satoshi font-bold text-[13px] text-[#424242]" numberOfLines={1}>{item.name}</Text>
                                            <Text className="font-satoshi text-[11px] text-[#9E9E9E] mt-1">₦{item.price?.toLocaleString() || '0'}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text className="text-[#9E9E9E] font-satoshi">No quick matches found.</Text>
                                }
                            />
                        )}
                    </View>
                ) : (
                    <>
                        <View className="mb-10">
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={`${item}-${index}`}
                                    className="flex-row items-center mb-5"
                                    onPress={() => navigation.navigate('SearchResults', { query: item })}
                                >
                                    <ArrowUpRight size={18} color="#424242" strokeWidth={2.5} />
                                    <Text className="ml-3 font-satoshi font-bold text-[15px] text-[#424242]">{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View>
                            <Text className="text-[#BDBDBD] font-satoshi font-bold text-[12px] mb-4">History</Text>
                            <View className="flex-row flex-wrap">
                                {HISTORY.map((item, index) => (
                                    <TouchableOpacity
                                        key={`${item}-${index}`}
                                        className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg mr-2 mb-3"
                                        onPress={() => navigation.navigate('SearchResults', { query: item })}
                                    >
                                        <Text className="font-satoshi text-[12px] text-[#424242]">{item}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}
            </View>
        </ScreenWrapper>
    );
};
