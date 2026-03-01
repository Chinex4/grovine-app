import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image, Modal } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import { orderService, Order } from '../../utils/orderService';
import { cartService } from '../../utils/cartService';

const CALLBACK_URL_PREFIX = 'https://grovine.ng/payment/callback';

type VerifyStatus = 'verifying' | 'success' | 'failed';

const formatNaira = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    const safeValue = Number.isFinite(numeric) ? numeric : 0;
    return `₦${safeValue.toLocaleString()}`;
};

const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
};

const getStatusColor = (status?: string | null) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'DELIVERED' || normalized === 'PAID' || normalized === 'SUCCESS') return '#2E7D32';
    if (normalized === 'AWAITING_PAYMENT' || normalized === 'PENDING' || normalized === 'INITIALIZED') return '#F57C00';
    if (normalized === 'FAILED' || normalized === 'CANCELLED') return '#D32F2F';
    return '#616161';
};

const extractReferenceFromUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
    } catch {
        return null;
    }
};

const getOrderImageUrl = (item: any) =>
    item?.product_image_url ||
    item?.image?.url ||
    item?.product?.image_url ||
    item?.product?.image?.url ||
    'https://via.placeholder.com/100';

export const OrderDetailScreen = ({ navigation, route }: any) => {
    const orderId = route?.params?.orderId;

    const queryClient = useQueryClient();

    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [pendingReference, setPendingReference] = useState<string | null>(null);

    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('verifying');
    const [verifyMessage, setVerifyMessage] = useState('Verifying payment...');

    const {
        data: orderDetailResponse,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['order-detail', orderId],
        queryFn: () => orderService.getOrderDetails(String(orderId)),
        enabled: !!orderId,
    });

    const order = orderDetailResponse?.data as Order | undefined;

    const updateStatusMutation = useMutation({
        mutationFn: () => orderService.updateOrderStatus(String(orderId), 'DELIVERED'),
        onSuccess: async () => {
            Toast.show({ type: 'success', text1: 'Order marked as delivered' });
            await Promise.all([
                refetch(),
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
            ]);
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error?.response?.data?.message || 'Could not update order status',
            });
        },
    });

    const verifyPaymentMutation = useMutation({
        mutationFn: (reference: string) => cartService.verifyPaystackPayment(reference),
    });

    const orderItems = order?.items || [];

    const orderTotals = useMemo(() => {
        const subtotal = Number(order?.subtotal ?? order?.total ?? order?.price ?? 0);
        const total = Number(order?.total ?? order?.price ?? 0);
        return { subtotal, total };
    }, [order]);

    const isAwaitingPayment = String(order?.status || '').toUpperCase() === 'AWAITING_PAYMENT';
    const hasPaymentUrl = Boolean(
        order?.payment_authorization_url || order?.latest_paystack_payment?.gateway_response?.data?.authorization_url
    );

    const handleRefresh = async () => {
        await refetch();
    };

    const beginVerify = async (reference: string) => {
        setVerifyStatus('verifying');
        setVerifyMessage('Verifying payment...');
        setVerifyModalVisible(true);

        try {
            const response = await verifyPaymentMutation.mutateAsync(reference);
            const status = String(response?.data?.status || '').toUpperCase();

            if (status === 'SUCCESS') {
                setVerifyStatus('success');
                setVerifyMessage('Payment successful. Your order is now being processed.');
            } else {
                setVerifyStatus('failed');
                setVerifyMessage(`Payment verification returned ${status || 'UNKNOWN'}.`);
            }

            await Promise.all([
                refetch(),
                queryClient.invalidateQueries({ queryKey: ['orders'] }),
            ]);
        } catch (error: any) {
            setVerifyStatus('failed');
            setVerifyMessage(error?.response?.data?.message || error?.message || 'Failed to verify payment.');
        } finally {
            setPendingReference(null);
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

    const handleCompletePayment = async () => {
        if (!order) return;

        let authorizationUrl =
            order.payment_authorization_url ||
            order.latest_paystack_payment?.gateway_response?.data?.authorization_url ||
            null;

        const reference =
            order.payment_reference ||
            order.latest_paystack_payment?.reference ||
            order.latest_paystack_payment?.gateway_response?.data?.reference ||
            null;

        if (!authorizationUrl) {
            try {
                const detail = (await orderService.getOrderDetails(order.id)).data;
                authorizationUrl =
                    detail.payment_authorization_url ||
                    detail.latest_paystack_payment?.gateway_response?.data?.authorization_url ||
                    null;
            } catch {
                authorizationUrl = null;
            }
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
    };

    if (!orderId) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-[15px] font-satoshi text-[#757575] text-center">No order selected.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 px-4 py-2 rounded-xl bg-[#4CAF50]">
                        <Text className="text-white font-satoshi font-bold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    if (isLoading && !order) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Order Details</Text>
                    <TouchableOpacity onPress={handleRefresh} disabled={isFetching}>
                        {isFetching ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <Ionicons name="refresh" size={20} color="#424242" />
                        )}
                    </TouchableOpacity>
                </View>

                {!order ? (
                    <View className="flex-1 items-center justify-center px-6">
                        <Text className="text-[15px] font-satoshi text-[#757575] text-center">Could not load order details.</Text>
                    </View>
                ) : (
                    <>
                        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                            <View className="bg-white rounded-2xl border border-[#EEEEEE] p-4 mb-4">
                                <View className="flex-row items-start justify-between mb-2">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-[16px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                            {order.order_number || `Order #${order.id.slice(0, 8)}`}
                                        </Text>
                                        <Text className="text-[12px] font-satoshi text-[#9E9E9E] mt-1">
                                            Placed: {formatDate(order.created_at)}
                                        </Text>
                                    </View>
                                    <View
                                        style={{ backgroundColor: `${getStatusColor(order.status)}1A` }}
                                        className="px-3 py-1 rounded-full"
                                    >
                                        <Text style={{ color: getStatusColor(order.status) }} className="text-[11px] font-satoshi font-bold">
                                            {order.status}
                                        </Text>
                                    </View>
                                </View>

                                <Text className="text-[12px] font-satoshi text-[#616161] mt-2">
                                    Payment: {order.payment_method || '-'} ({order.payment_status || '-'})
                                </Text>
                                <Text className="text-[12px] font-satoshi text-[#616161] mt-1">
                                    Delivery: {order.delivery_type || '-'}
                                </Text>
                                {order.scheduled_for ? (
                                    <Text className="text-[12px] font-satoshi text-[#616161] mt-1">
                                        Scheduled for: {formatDate(order.scheduled_for)}
                                    </Text>
                                ) : null}
                                {order.delivery_address ? (
                                    <Text className="text-[12px] font-satoshi text-[#616161] mt-1">
                                        Address: {order.delivery_address}
                                    </Text>
                                ) : null}
                                {order.rider_note ? (
                                    <Text className="text-[12px] font-satoshi text-[#616161] mt-1">
                                        Note: {order.rider_note}
                                    </Text>
                                ) : null}
                            </View>

                            <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-2">Items</Text>
                            {orderItems.map((item) => (
                                <View key={item.id} className="bg-white rounded-2xl border border-[#EEEEEE] p-3 mb-3 flex-row">
                                    <Image source={{ uri: getOrderImageUrl(item) }} className="w-14 h-14 rounded-lg mr-3" />
                                    <View className="flex-1">
                                        <Text className="text-[14px] font-satoshi font-bold text-[#424242]" numberOfLines={1}>
                                            {item.product_name || item.product?.name || 'Product'}
                                        </Text>
                                        <Text className="text-[11px] font-satoshi text-[#9E9E9E] mt-1">
                                            Qty: {item.quantity} x {formatNaira(item.unit_price || item.price)}
                                        </Text>
                                        <Text className="text-[13px] font-satoshi font-bold text-[#424242] mt-1">
                                            {formatNaira(item.line_total || Number(item.quantity || 0) * Number(item.unit_price || item.price || 0))}
                                        </Text>
                                    </View>
                                </View>
                            ))}

                            <View className="bg-white rounded-2xl border border-[#EEEEEE] p-4 mb-6 mt-1">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-[13px] font-satoshi text-[#9E9E9E]">Subtotal</Text>
                                    <Text className="text-[13px] font-satoshi font-bold text-[#424242]">{formatNaira(orderTotals.subtotal)}</Text>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-[15px] font-satoshi font-bold text-[#424242]">Total</Text>
                                    <Text className="text-[15px] font-satoshi font-bold text-[#424242]">{formatNaira(orderTotals.total)}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View className="px-6 py-5 bg-white border-t border-[#EEEEEE]">
                            {isAwaitingPayment && hasPaymentUrl ? (
                                <TouchableOpacity
                                    onPress={handleCompletePayment}
                                    disabled={verifyPaymentMutation.isPending}
                                    className="h-12 rounded-xl bg-[#4CAF50] items-center justify-center"
                                >
                                    <Text className="text-white font-satoshi font-bold text-[14px]">Complete Payment</Text>
                                </TouchableOpacity>
                            ) : String(order.status).toUpperCase() !== 'DELIVERED' ? (
                                <TouchableOpacity
                                    onPress={() => updateStatusMutation.mutate()}
                                    disabled={updateStatusMutation.isPending}
                                    className="h-12 rounded-xl bg-[#4CAF50] items-center justify-center"
                                >
                                    {updateStatusMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-satoshi font-bold text-[14px]">Mark As Received</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View className="h-12 rounded-xl bg-[#E8F5E9] items-center justify-center">
                                    <Text className="text-[#2E7D32] font-satoshi font-bold text-[14px]">Order Delivered</Text>
                                </View>
                            )}
                        </View>
                    </>
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
                            <Text className={`font-satoshi font-bold text-[12px] ${pendingReference ? 'text-[#4CAF50]' : 'text-[#BDBDBD]'}`}>
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
