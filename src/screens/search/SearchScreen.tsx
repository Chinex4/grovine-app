import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { ArrowUpRight } from 'lucide-react-native';

const SUGGESTIONS = [
    'Drinks',
    'Fruits',
    'Jollof Rice Recipe',
    'Vegetables',
    'Grains'
];

const HISTORY = [
    'Grape',
    'Rice',
    'Quaker Oats',
    'Abacha',
    'Yellow Apple',
    'Quaker Oats',
    'Grape',
    'Rice'
];

export const SearchScreen = ({ navigation }: any) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigation.navigate('SearchResults', { query: searchQuery });
        }
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1 px-6 pt-10">
                {/* Search Bar */}
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-xl px-4 h-12 mb-8">
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
                        <Ionicons name="options-outline" size={18} color="#BDBDBD" />
                    </TouchableOpacity>
                </View>

                {/* Suggestions */}
                <View className="mb-10">
                    {SUGGESTIONS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-row items-center mb-5"
                            onPress={() => navigation.navigate('SearchResults', { query: item })}
                        >
                            <ArrowUpRight size={18} color="#424242" strokeWidth={2.5} />
                            <Text className="ml-3 font-satoshi font-bold text-[15px] text-[#424242]">{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* History Section */}
                <View>
                    <Text className="text-[#BDBDBD] font-satoshi font-bold text-[12px] mb-4">History</Text>
                    <View className="flex-row flex-wrap">
                        {HISTORY.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-lg mr-2 mb-3"
                            >
                                <Text className="font-satoshi text-[12px] text-[#424242]">{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};
