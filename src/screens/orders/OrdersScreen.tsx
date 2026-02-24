import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, BroadStatus, OrderStatus } from '../../utils/orderService';
import Toast from 'react-native-toast-message';

const TABS = ['My Cart', 'Ongoing', 'Completed', 'Cancelled'];

const TAB_MAPPING: Record<string, BroadStatus | null> = {
    'Ongoing': 'ONGOING',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
    'My Cart': null, // Cart logic is separate
};

export const OrdersScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState('My Cart');
    const queryClient = useQueryClient();

    const mappedStatus = TAB_MAPPING[activeTab];

    const { data: ordersResponse, isLoading, refetch } = useQuery({
        queryKey: ['orders', mappedStatus],
        queryFn: () => orderService.listOrders(mappedStatus!),
        enabled: !!mappedStatus,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: OrderStatus }) =>
            orderService.updateOrderStatus(id, status),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Order updated' });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error.response?.data?.message || 'Could not update order'
            });
        }
    });

    const orders = ordersResponse?.data || [];

    const renderOrderItem = ({ item }: { item: any }) => (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#EEEEEE]">
            <View className="flex-row items-center mb-4">
                <Image
                    source={{ uri: item.items?.[0]?.image?.url || 'https://via.placeholder.com/100' }}
                    className="w-12 h-12 rounded-lg mr-3"
                />
                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[16px] font-satoshi font-bold text-[#424242]">
                            Order #{item.id?.substring(0, 8)}
                        </Text>
                        <ChevronRight size={18} color="#9E9E9E" />
                    </View>
                    <Text className="text-[12px] font-satoshi text-[#9E9E9E]">
                        {item.items?.length || 0} items - NGN {item.price?.toLocaleString()}
                    </Text>
                </View>
            </View>

            {activeTab === 'Ongoing' ? (
                <TouchableOpacity
                    onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'DELIVERED' })}
                    disabled={updateStatusMutation.isPending}
                    className="bg-[#4CAF50] py-3 rounded-xl items-center justify-center"
                >
                    <Text className="text-white font-satoshi font-bold text-[14px]">
                        {updateStatusMutation.isPending ? 'Updating...' : 'Mark As Received'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <View className="flex-row">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Checkout', { orderId: item.id })}
                        className="flex-1 bg-[#4CAF50] py-3 rounded-xl items-center justify-center mr-2"
                    >
                        <Text className="text-white font-satoshi font-bold text-[14px]">View Order</Text>
                    </TouchableOpacity>
                    {(activeTab === 'My Cart' || activeTab === 'Completed' || activeTab === 'Cancelled') && (
                        <TouchableOpacity
                            className="bg-[#4CAF50]/10 px-6 py-3 rounded-xl items-center justify-center"
                        >
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-[14px]">Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Orders</Text>
                    <TouchableOpacity onPress={() => refetch()}>
                        <Ionicons name="refresh" size={20} color="#424242" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View className="mb-6">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingLeft: 24, paddingRight: 8 }}
                    >
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg mr-2 border ${activeTab === tab ? 'bg-[#4CAF50] border-[#4CAF50]' : 'bg-white border-[#E0E0E0]'}`}
                            >
                                <Text className={`font-satoshi font-bold text-[12px] ${activeTab === tab ? 'text-white' : 'text-[#9E9E9E]'}`}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center mt-20">
                                <Text className="text-gray-400 font-satoshi">No orders found in this section.</Text>
                            </View>
                        )}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};

const ChevronRight = ({ size, color }: any) => (
    <Ionicons name="chevron-forward" size={size} color={color} />
);
