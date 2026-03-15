import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { orderService, BroadStatus, OrderStatus, Order } from '../../utils/orderService';
import { cartService, CartItem } from '../../utils/cartService';
import { useCartActions } from '../../hooks/useCartActions';
import { createEmptyCartResponse, getProductIdFromCartItem } from '../../utils/cartQueryUtils';

const TABS = ['My Cart', 'Ongoing', 'Completed', 'Cancelled'];
const CALLBACK_URL_PREFIX = 'https://grovine.ng/payment/callback';

type VerifyStatus = 'verifying' | 'success' | 'failed';

const TAB_MAPPING: Record<string, BroadStatus | null> = {
    Ongoing: 'ONGOING',
    Completed: 'COMPLETED',
    Cancelled: 'CANCELLED',
    'My Cart': null,
};

const formatNaira = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return `₦${safeValue.toLocaleString()}`;
};

const extractReferenceFromUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
    } catch {
        return null;
    }
};

const getOrderImageUrl = (order: Order) => {
    return (
        order.items?.[0]?.product_image_url ||
        order.items?.[0]?.image?.url ||
        order.items?.[0]?.product?.image_url ||
        order.items?.[0]?.product?.image?.url ||
        'https://via.placeholder.com/100'
    );
};

export const OrdersScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState('My Cart');
    const [activeOrderActionId, setActiveOrderActionId] = useState<string | null>(null);

    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [pendingReference, setPendingReference] = useState<string | null>(null);

    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('verifying');
    const [verifyMessage, setVerifyMessage] = useState('Verifying payment...');

    const queryClient = useQueryClient();
    const {
        cart,
        cartQuery,
        items: cartItems,
        setProductQuantity,
        hasPendingCartSync,
    } = useCartActions();

    const mappedStatus = TAB_MAPPING[activeTab];

    const {
        data: ordersResponse,
        isLoading: isOrdersLoading,
        refetch: refetchOrders,
    } = useQuery({
        queryKey: ['orders', mappedStatus],
        queryFn: () => orderService.listOrders(mappedStatus as BroadStatus),
        enabled: activeTab !== 'My Cart' && !!mappedStatus,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
            orderService.updateOrderStatus(id, status),
    });

    const verifyPaymentMutation = useMutation({
        mutationFn: (reference: string) => cartService.verifyPaystackPayment(reference),
    });

    const clearCartMutation = useMutation({
        mutationFn: cartService.clearCart,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['cart'] });
            const previousCart = queryClient.getQueryData(['cart']);
            queryClient.setQueryData(['cart'], createEmptyCartResponse());
            return { previousCart };
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['cart'] });
            Toast.show({ type: 'success', text1: 'Cart cleared' });
        },
        onError: (error: any, _variables, context) => {
            if (context?.previousCart) {
                queryClient.setQueryData(['cart'], context.previousCart);
            }
            Toast.show({
                type: 'error',
                text1: 'Could not clear cart',
                text2: error.response?.data?.message || error.message || 'Please try again.',
            });
        },
    });

    const orders = ordersResponse?.data || [];
    const cartTotal = Number(cart?.total || 0);
    const cartSubtotal = Number(cart?.subtotal || 0);
    const totalDiscount = Number(cart?.total_discount || 0);
    const itemCount = Number(cart?.item_count || 0);

    const isCartActionPending = clearCartMutation.isPending || hasPendingCartSync;

    const isLoading = activeTab === 'My Cart' ? cartQuery.isLoading : isOrdersLoading;

    const handleRefresh = () => {
        if (activeTab === 'My Cart') {
            cartQuery.refetch();
            return;
        }
        refetchOrders();
    };

    const refreshOrderQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['orders'] }),
            queryClient.invalidateQueries({ queryKey: ['orders', 'ONGOING'] }),
            queryClient.invalidateQueries({ queryKey: ['orders', 'COMPLETED'] }),
            queryClient.invalidateQueries({ queryKey: ['orders', 'CANCELLED'] }),
            queryClient.invalidateQueries({ queryKey: ['cart'] }),
        ]);
    };

    const beginVerify = async (reference: string) => {
        setVerifyStatus('verifying');
        setVerifyMessage('Verifying payment...');
        setVerifyModalVisible(true);

        try {
            const response = await verifyPaymentMutation.mutateAsync(reference);
            const status = String(response?.data?.status || '').toUpperCase();
            const orderStatus = String(response?.data?.order_status || '');
            const paymentStatus = String(response?.data?.payment_status || '');

            if (status === 'SUCCESS') {
                setVerifyStatus('success');
                setVerifyMessage('Payment successful. Your order is now being processed.');
            } else {
                setVerifyStatus('failed');
                setVerifyMessage(
                    `Verification returned ${status || 'UNKNOWN'} (order: ${orderStatus || '-'}, payment: ${paymentStatus || '-'})`
                );
            }

            await refreshOrderQueries();
        } catch (error: any) {
            setVerifyStatus('failed');
            setVerifyMessage(error?.response?.data?.message || error?.message || 'Failed to verify payment.');
        } finally {
            setPendingReference(null);
        }
    };

    const openPaymentForOrder = async (order: Order) => {
        setActiveOrderActionId(order.id);

        try {
            let authorizationUrl =
                order.payment_authorization_url ||
                order.latest_paystack_payment?.gateway_response?.data?.authorization_url ||
                null;

            let reference =
                order.payment_reference ||
                order.latest_paystack_payment?.reference ||
                order.latest_paystack_payment?.gateway_response?.data?.reference ||
                null;

            if (!authorizationUrl) {
                const detailResponse = await orderService.getOrderDetails(order.id);
                const detail = detailResponse.data;

                authorizationUrl =
                    detail.payment_authorization_url ||
                    detail.latest_paystack_payment?.gateway_response?.data?.authorization_url ||
                    null;

                reference =
                    reference ||
                    detail.payment_reference ||
                    detail.latest_paystack_payment?.reference ||
                    detail.latest_paystack_payment?.gateway_response?.data?.reference ||
                    null;
            }

            if (!authorizationUrl) {
                Toast.show({
                    type: 'error',
                    text1: 'Payment link unavailable',
                    text2: 'No authorization URL was returned for this order.',
                });
                return;
            }

            setPendingReference(reference);
            setCheckoutUrl(authorizationUrl);
            setCheckoutModalVisible(true);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Could not open payment',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        } finally {
            setActiveOrderActionId(null);
        }
    };

    const handleMarkAsReceived = async (orderId: string) => {
        setActiveOrderActionId(orderId);
        try {
            await updateStatusMutation.mutateAsync({ id: orderId, status: 'DELIVERED' });
            Toast.show({ type: 'success', text1: 'Order marked as delivered' });
            await refreshOrderQueries();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error.response?.data?.message || 'Could not update order',
            });
        } finally {
            setActiveOrderActionId(null);
        }
    };

    const handleWebNavigation = (request: { url: string }) => {
        const url = request?.url || '';
        if (url.startsWith(CALLBACK_URL_PREFIX) || url.includes('grovine.ng/payment/callback')) {
            const reference = extractReferenceFromUrl(url) || pendingReference;
            setCheckoutModalVisible(false);

            if (reference) {
                beginVerify(reference);
            } else {
                setVerifyStatus('failed');
                setVerifyMessage('Payment completed but reference was not found.');
                setVerifyModalVisible(true);
            }

            return false;
        }

        return true;
    };

    const orderRows = useMemo(() => orders, [orders]);

    const renderOrderItem = ({ item }: { item: Order }) => {
        const itemCountValue = Number(item.item_count ?? item.items?.length ?? 0);
        const orderTotal = Number(item.total ?? item.price ?? 0);
        const isAwaitingPayment = String(item.status).toUpperCase() === 'AWAITING_PAYMENT';
        const isActionLoading = activeOrderActionId === item.id;

        return (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-[#EEEEEE]">
                <View className="flex-row items-center mb-4">
                    <Image
                        source={{ uri: getOrderImageUrl(item) }}
                        className="w-12 h-12 rounded-lg mr-3"
                    />
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-[16px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                {item.order_number || `Order #${item.id?.substring(0, 8)}`}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
                        </View>
                        <Text className="text-[12px] font-satoshi text-[#9E9E9E]">
                            {itemCountValue} items - {formatNaira(orderTotal)}
                        </Text>
                    </View>
                </View>

                {activeTab === 'Ongoing' ? (
                    isAwaitingPayment ? (
                        <TouchableOpacity
                            onPress={() => openPaymentForOrder(item)}
                            disabled={isActionLoading}
                            className="bg-[#4CAF50] py-3 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-satoshi font-bold text-[14px]">
                                {isActionLoading ? 'Preparing...' : 'Complete Payment'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => handleMarkAsReceived(item.id)}
                            disabled={isActionLoading}
                            className="bg-[#4CAF50] py-3 rounded-xl items-center justify-center"
                        >
                            <Text className="text-white font-satoshi font-bold text-[14px]">
                                {isActionLoading ? 'Updating...' : 'Mark As Received'}
                            </Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
                        className="bg-[#4CAF50] py-3 rounded-xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[14px]">View Order</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-[#EEEEEE]">
            <View className="flex-row items-center">
                <Image
                    source={{ uri: item.product?.media?.url || item.food?.media?.url || 'https://via.placeholder.com/100' }}
                    className="w-14 h-14 rounded-lg mr-3"
                />
                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[15px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                            {item.product?.name || item.food?.name || 'Product'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setProductQuantity(getProductIdFromCartItem(item), 0)}
                            className="bg-red-50 p-1 rounded-md ml-2"
                        >
                            <Ionicons name="trash-outline" size={14} color="#F44336" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-[11px] font-satoshi text-[#9E9E9E] mb-1">
                        {formatNaira(item.product?.price || item.food?.price || 0)} per item
                    </Text>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[13px] font-satoshi font-bold text-[#424242]">
                            {formatNaira(item.line_total || item.quantity * (item.product?.price || item.food?.price || 0))}
                        </Text>
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-2 py-1">
                            <TouchableOpacity
                                onPress={() =>
                                    setProductQuantity(
                                        getProductIdFromCartItem(item),
                                        Math.max(0, item.quantity - 1)
                                    )
                                }
                            >
                                <Ionicons name="remove" size={16} color="#424242" />
                            </TouchableOpacity>
                            <Text className="mx-3 font-satoshi font-bold text-[14px]">{item.quantity}</Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setProductQuantity(getProductIdFromCartItem(item), item.quantity + 1)
                                }
                            >
                                <Ionicons name="add" size={16} color="#424242" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Orders</Text>
                    <TouchableOpacity onPress={handleRefresh}>
                        <Ionicons name="refresh" size={20} color="#424242" />
                    </TouchableOpacity>
                </View>

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

                {activeTab === 'My Cart' && cartItems.length > 0 && (
                    <View className="px-6 mb-4">
                        <View className="bg-white rounded-2xl p-4 border border-[#EEEEEE]">
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-satoshi text-[13px] text-[#9E9E9E]">Items ({itemCount})</Text>
                                <Text className="font-satoshi font-bold text-[13px] text-[#424242]">{formatNaira(cartSubtotal)}</Text>
                            </View>
                            <View className="flex-row items-center justify-between mb-2">
                                <Text className="font-satoshi text-[13px] text-[#9E9E9E]">Discount</Text>
                                <Text className="font-satoshi font-bold text-[13px] text-[#4CAF50]">-{formatNaira(totalDiscount)}</Text>
                            </View>
                            <View className="h-[1px] bg-gray-100 my-2" />
                            <View className="flex-row items-center justify-between">
                                <Text className="font-satoshi font-bold text-[15px] text-[#424242]">Total</Text>
                                <Text className="font-satoshi font-bold text-[15px] text-[#424242]">{formatNaira(cartTotal)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#4CAF50" />
                    </View>
                ) : activeTab === 'My Cart' ? (
                    <FlatList
                        data={cartItems}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center mt-20">
                                <Text className="text-gray-400 font-satoshi">Your cart is empty.</Text>
                            </View>
                        )}
                    />
                ) : (
                    <FlatList
                        data={orderRows}
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

                {activeTab === 'My Cart' && cartItems.length > 0 && (
                    <View className="px-6 py-6 bg-white border-t border-[#EEEEEE]">
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => clearCartMutation.mutate()}
                                disabled={isCartActionPending}
                                className="mr-3 px-4 h-12 rounded-xl border border-[#F44336] items-center justify-center"
                            >
                                <Text className="text-[#F44336] font-satoshi font-bold text-[13px]">Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Checkout')}
                                className="flex-1 bg-[#4CAF50] h-12 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-satoshi font-bold text-[14px]">
                                    Checkout - {formatNaira(cartTotal)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            <Modal
                visible={checkoutModalVisible}
                animationType="slide"
                onRequestClose={() => setCheckoutModalVisible(false)}
            >
                <View className="flex-1 bg-white">
                    <View className="px-4 pt-20 pb-3 flex-row items-center justify-between border-b border-gray-100">
                        <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                            <Ionicons name="close" size={22} color="#424242" />
                        </TouchableOpacity>
                        <Text className="font-satoshi font-bold text-[16px] text-[#424242]">Complete Payment</Text>
                        <TouchableOpacity
                            onPress={() => {
                                if (pendingReference) {
                                    setCheckoutModalVisible(false);
                                    beginVerify(pendingReference);
                                }
                            }}
                            disabled={!pendingReference}
                        >
                            <Text
                                className={`font-satoshi font-bold text-[12px] ${pendingReference ? 'text-[#4CAF50]' : 'text-[#BDBDBD]'}`}
                            >
                                I paid
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {checkoutUrl ? (
                        <WebView
                            source={{ uri: checkoutUrl }}
                            onShouldStartLoadWithRequest={handleWebNavigation}
                            startInLoadingState
                            renderLoading={() => (
                                <View className="flex-1 items-center justify-center">
                                    <ActivityIndicator size="large" color="#4CAF50" />
                                </View>
                            )}
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#4CAF50" />
                        </View>
                    )}
                </View>
            </Modal>

            <Modal
                visible={verifyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setVerifyModalVisible(false)}
            >
                <View className="flex-1 bg-black/45 items-center justify-center px-8">
                    <View className="bg-white rounded-2xl w-full p-5 items-center">
                        {verifyStatus === 'verifying' ? (
                            <ActivityIndicator color="#4CAF50" size="large" />
                        ) : (
                            <Ionicons
                                name={verifyStatus === 'success' ? 'checkmark-circle' : 'close-circle'}
                                size={56}
                                color={verifyStatus === 'success' ? '#4CAF50' : '#F44336'}
                            />
                        )}

                        <Text className="font-satoshi font-bold text-[16px] text-[#424242] mt-3 mb-2">
                            {verifyStatus === 'verifying'
                                ? 'Verifying Payment'
                                : verifyStatus === 'success'
                                    ? 'Payment Successful'
                                    : 'Payment Verification Failed'}
                        </Text>

                        <Text className="font-satoshi text-[12px] text-[#9E9E9E] text-center mb-4">{verifyMessage}</Text>

                        {verifyStatus !== 'verifying' ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setVerifyModalVisible(false);
                                    handleRefresh();
                                }}
                                className="w-full h-11 rounded-xl bg-[#4CAF50] items-center justify-center"
                            >
                                <Text className="font-satoshi font-bold text-[13px] text-white">Done</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};
