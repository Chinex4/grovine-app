import React from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppNotification, notificationService } from '../../utils/notificationService';
import Toast from 'react-native-toast-message';
import { handleNotificationActionUrl } from '../../utils/notificationDeepLink';
import { navigateFromRoot } from '../../navigation/navigationRef';

const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
};

export const NotificationsScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();

    const {
        data: notificationsResponse,
        isLoading,
        isError,
        isRefetching,
        refetch,
    } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.listNotifications(50),
    });

    const { data: unreadCountResponse } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: notificationService.getUnreadCount,
    });

    const markReadMutation = useMutation({
        mutationFn: (notificationId: string) => notificationService.markRead(notificationId),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['notifications'] }),
                queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
            ]);
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: notificationService.markAllRead,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['notifications'] }),
                queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] }),
            ]);
            Toast.show({
                type: 'success',
                text1: 'All notifications marked as read',
            });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Failed to mark all as read',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        },
    });

    const notifications = notificationsResponse?.data || [];
    const unreadCount = unreadCountResponse?.count || 0;

    const handleViewNotification = async (item: AppNotification) => {
        if (!item.is_read) {
            try {
                await markReadMutation.mutateAsync(item.id);
            } catch {
                // no-op
            }
        }

        if (item.action_url) {
            const handled = await handleNotificationActionUrl(item.action_url, navigateFromRoot);
            if (!handled) {
                Toast.show({
                    type: 'error',
                    text1: 'Unable to open notification link',
                });
            }
        }
    };

    const renderNotificationItem = ({ item }: { item: AppNotification }) => (
        <View
            className={`flex-row items-center px-6 py-3 border-b border-gray-50 ${item.is_read ? 'bg-white' : 'bg-[#E8F5E9]'}`}
        >
            <View className="w-10 h-10 rounded-full mr-4 bg-[#4CAF50]/15 items-center justify-center">
                <Ionicons name="notifications-outline" size={18} color="#4CAF50" />
            </View>
            <View className="flex-1 mr-4">
                <Text className="text-[13px] font-satoshi text-gray-500 leading-[18px]" numberOfLines={2}>
                    <Text className="font-bold text-gray-700">{item.title}: </Text>
                    {item.message}
                </Text>
                <Text className="text-[10px] text-[#BDBDBD] mt-1">{formatDate(item.created_at)}</Text>
            </View>
            <TouchableOpacity
                onPress={() => handleViewNotification(item)}
                disabled={markReadMutation.isPending}
                className="bg-[#4CAF50] px-3.5 py-1.5 rounded-lg"
            >
                <Text className="text-white font-satoshi font-bold text-xs">View</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1 bg-white">
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
                    <TouchableOpacity
                        onPress={() => markAllReadMutation.mutate()}
                        disabled={unreadCount === 0 || markAllReadMutation.isPending}
                        className={`px-2.5 py-1 rounded-md ${unreadCount === 0 ? 'bg-gray-100' : 'bg-[#4CAF50]'}`}
                    >
                        <Text className={`text-[10px] font-bold ${unreadCount === 0 ? 'text-[#BDBDBD]' : 'text-white'}`}>
                            Mark all
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="px-6 py-3 flex-row items-center justify-between">
                    <Text className="text-[13px] font-satoshi font-bold text-gray-400 uppercase tracking-tight">
                        Inbox
                    </Text>
                    <View className="w-5 h-5 bg-[#F2994A] rounded-full items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                    </View>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : isError ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-[#9E9E9E] font-satoshi text-center mb-4">Failed to load notifications.</Text>
                        <TouchableOpacity
                            onPress={() => refetch()}
                            className="bg-[#4CAF50] px-4 py-2 rounded-lg"
                        >
                            <Text className="text-white font-satoshi font-bold">Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={refetch}
                                tintColor="#4CAF50"
                            />
                        }
                        ListEmptyComponent={
                            <View className="px-6 py-12 items-center">
                                <Ionicons name="notifications-off-outline" size={52} color="#E0E0E0" />
                                <Text className="text-[#9E9E9E] font-satoshi mt-3">No notifications yet.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
};
