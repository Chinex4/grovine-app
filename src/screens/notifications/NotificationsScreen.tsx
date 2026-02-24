import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';

const NOTIFICATIONS = [
    {
        id: '1',
        type: 'recipe',
        title: 'New Recipe',
        description: 'Chef Ajunna just uploaded a new recipe on how to make scotched....',
        image: require('../../assets/images/chef_cooking_1771718982720.jpg'),
        isRead: false,
        date: '15 NOV 2024',
    },
    {
        id: '2',
        type: 'sale',
        title: 'Fast Sales',
        description: 'View groceries on cheap and fast sales.....',
        image: require('../../assets/images/grocery_basket_fresh_1771719000149.jpg'),
        isRead: true,
        date: '15 NOV 2024',
    },
    {
        id: '3',
        type: 'sale',
        title: 'Fast Sales',
        description: 'View groceries on cheap and fast sales.....',
        image: require('../../assets/images/grocery_basket_fresh_1771719000149.jpg'),
        isRead: true,
        date: '15 NOV 2024',
    },
    {
        id: '4',
        type: 'sale',
        title: 'Fast Sales',
        description: 'View groceries on cheap and fast sales.....',
        image: require('../../assets/images/grocery_basket_fresh_1771719000149.jpg'),
        isRead: true,
        date: '15 NOV 2024',
    },
    {
        id: '5',
        type: 'sale',
        title: 'Fast Sales',
        description: 'View groceries on cheap and fast sales.....',
        image: require('../../assets/images/grocery_basket_fresh_1771719000149.jpg'),
        isRead: true,
        date: '15 NOV 2024',
    },
];

export const NotificationsScreen = ({ navigation }: any) => {
    const renderNotificationItem = ({ item }: { item: typeof NOTIFICATIONS[0] }) => (
        <View
            className={`flex-row items-center px-6 py-3 border-b border-gray-50 ${item.isRead ? 'bg-white' : 'bg-[#E8F5E9]'}`}
        >
            <Image
                source={item.image}
                className="w-10 h-10 rounded-full mr-4"
            />
            <View className="flex-1 mr-4">
                <Text className="text-[13px] font-satoshi text-gray-500 leading-[18px]" numberOfLines={2}>
                    <Text className="font-bold text-gray-700">{item.title}: </Text>
                    {item.description}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => navigation.navigate('ProductDetail')}
                className="bg-[#4CAF50] px-3.5 py-1.5 rounded-lg"
            >
                <Text className="text-white font-satoshi font-bold text-xs">View</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1 bg-white">
                {/* Custom Header */}
                <View className="flex-row items-center justify-between px-6 pt-10 pb-3 border-b border-gray-100">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-9 h-9 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg"
                    >
                        <Ionicons name="arrow-back" size={18} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">
                        Notifications
                    </Text>
                    <View className="w-5 h-5 bg-[#F2994A] rounded-full items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">9</Text>
                    </View>
                </View>

                {/* Date Header */}
                <View className="px-6 py-3">
                    <Text className="text-[14px] font-satoshi font-bold text-gray-400 uppercase tracking-tight">
                        15 NOV 2024
                    </Text>
                </View>

                <FlatList
                    data={NOTIFICATIONS}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </ScreenWrapper>
    );
};
