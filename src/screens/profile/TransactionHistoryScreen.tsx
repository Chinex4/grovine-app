import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { transactionService, Transaction } from '../../utils/transactionService';

export const TransactionHistoryScreen = ({ navigation }: any) => {
    const { data: transactionResponse, isLoading, error } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => transactionService.listTransactions({ per_page: 20 }),
    });

    const transactions = transactionResponse?.data?.data || [];

    const renderTransactionItem = ({ item }: { item: Transaction }) => {
        const isCredit = item.type === 'CREDIT';

        return (
            <View className="flex-row items-center justify-between py-4 border-b border-gray-50">
                <View className="flex-row items-center">
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Ionicons
                            name={isCredit ? 'arrow-down' : 'arrow-up'}
                            size={18}
                            color={isCredit ? '#4CAF50' : '#F44336'}
                        />
                    </View>
                    <View>
                        <Text className="text-[15px] font-satoshi font-bold text-[#424242] capitalize">
                            {item.purpose.toLowerCase().replace('_', ' ')}
                        </Text>
                        <Text className="text-[12px] font-satoshi text-[#9E9E9E]">
                            {new Date(item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <Text className={`text-[15px] font-satoshi font-bold ${isCredit ? 'text-[#4CAF50]' : 'text-[#424242]'}`}>
                    {isCredit ? '+' : '-'}₦{item.amount.toLocaleString()}
                </Text>
            </View>
        );
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1 px-6">
                {/* Header */}
                <View className="pt-10 pb-6 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Transaction History</Text>
                    <View className="w-6" />
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#4CAF50" size="large" />
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-400 font-satoshi">Failed to load transactions</Text>
                    </View>
                ) : transactions.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="receipt-outline" size={64} color="#E0E0E0" />
                        <Text className="text-[16px] font-satoshi font-bold text-[#9E9E9E] mt-4">No transactions yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderTransactionItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};
