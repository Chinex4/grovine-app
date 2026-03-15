import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Modal,
    Share,
    Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService, CheckoutParams } from '../../utils/cartService';
import Toast from 'react-native-toast-message';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { WebView } from 'react-native-webview';
import { useCartActions } from '../../hooks/useCartActions';
import { getProductIdFromCartItem } from '../../utils/cartQueryUtils';

const CALLBACK_URL_PREFIX = 'https://grovine.ng/payment/callback';

type VerifyStatus = 'verifying' | 'success' | 'failed';

const makeIdempotencyKey = () =>
    `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const extractReferenceFromUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
    } catch {
        return null;
    }
};

const formatDateTime = (date: Date) =>
    date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const CheckoutScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'Your Order' | 'Delivery & Payment'>('Your Order');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [riderNote, setRiderNote] = useState('');
    const [deliveryType, setDeliveryType] = useState<'NOW' | 'SCHEDULED'>('NOW');
    const [scheduledFor, setScheduledFor] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'WALLET' | 'PAY_FOR_ME'>('ONLINE');

    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [pendingReference, setPendingReference] = useState<string | null>(null);

    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('verifying');
    const [verifyMessage, setVerifyMessage] = useState('Verifying payment...');

    const queryClient = useQueryClient();
    const { cart, items, cartQuery, setProductQuantity, hasPendingCartSync } = useCartActions();

    const checkoutMutation = useMutation({
        mutationFn: (params: CheckoutParams) => cartService.checkout(params),
    });

    const verifyPaymentMutation = useMutation({
        mutationFn: (reference: string) => cartService.verifyPaystackPayment(reference),
    });

    const totalPrice = cart?.total || 0;
    const subTotal = cart?.subtotal || totalPrice;
    const totalDiscount = cart?.total_discount || 0;

    const isBusy = checkoutMutation.isPending || verifyPaymentMutation.isPending || hasPendingCartSync;

    const canSubmit = items.length > 0 && !isBusy;

    const checkoutButtonTitle = useMemo(() => {
        if (checkoutMutation.isPending) return 'Processing...';
        if (activeTab === 'Your Order') return `Checkout - ₦${totalPrice.toLocaleString()}`;
        return paymentMethod === 'PAY_FOR_ME' ? 'Generate Pay Link' : 'Place Order';
    }, [activeTab, totalPrice, paymentMethod, checkoutMutation.isPending]);

    const goToOrdersTab = () => {
        navigation.navigate('Main', { screen: 'Orders' });
    };

    const refreshCartQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['cart'] }),
            queryClient.invalidateQueries({ queryKey: ['orders'] }),
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
                    `Payment verification returned ${status || 'UNKNOWN'} (order: ${orderStatus || '-'}, payment: ${paymentStatus || '-'})`
                );
            }

            await refreshCartQueries();
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
            const ref = extractReferenceFromUrl(url) || pendingReference;
            setCheckoutModalVisible(false);
            if (ref) {
                beginVerify(ref);
            } else {
                setVerifyStatus('failed');
                setVerifyMessage('Payment completed but reference was not found.');
                setVerifyModalVisible(true);
            }
            return false;
        }
        return true;
    };

    const handleDateTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDateTimePicker(false);
        }
        if (event.type === 'set' && selectedDate) {
            setScheduledFor(selectedDate);
        }
    };

    const handleSharePayLink = async (url: string) => {
        try {
            await Share.share({
                message: `Please complete this payment: ${url}`,
                url,
            });
        } catch {
            Toast.show({
                type: 'error',
                text1: 'Could not open share sheet',
            });
        }
    };

    const handlePlaceOrder = async () => {
        if (!deliveryAddress.trim()) {
            Toast.show({ type: 'error', text1: 'Please enter a delivery address' });
            setActiveTab('Delivery & Payment');
            return;
        }

        if (deliveryType === 'SCHEDULED' && scheduledFor.getTime() <= Date.now()) {
            Toast.show({
                type: 'error',
                text1: 'Scheduled time must be in the future',
            });
            return;
        }

        const params: CheckoutParams = {
            delivery: {
                type: deliveryType,
                address: deliveryAddress.trim(),
                note_for_rider: riderNote.trim(),
                scheduled_for: deliveryType === 'SCHEDULED' ? scheduledFor.toISOString() : undefined,
            },
            payment_method: paymentMethod,
            idempotency_key: makeIdempotencyKey(),
        };

        try {
            const response = await checkoutMutation.mutateAsync(params);
            const paymentData = response?.data?.payment || {};
            const reference = paymentData?.reference || response?.data?.order?.payments?.[0]?.reference || null;
            const authorizationUrl = paymentData?.authorization_url || response?.data?.order?.payments?.[0]?.gateway_response?.data?.authorization_url;

            if (paymentMethod === 'WALLET') {
                Toast.show({ type: 'success', text1: 'Order placed successfully' });
                await refreshCartQueries();
                goToOrdersTab();
                return;
            }

            if (!authorizationUrl) {
                Toast.show({
                    type: 'error',
                    text1: 'Checkout failed',
                    text2: 'Payment authorization URL is missing.',
                });
                return;
            }

            if (paymentMethod === 'PAY_FOR_ME') {
                await handleSharePayLink(authorizationUrl);
                await refreshCartQueries();
                Toast.show({
                    type: 'success',
                    text1: 'Payment link ready',
                    text2: 'Share the link so someone can complete payment for you.',
                });
                goToOrdersTab();
                return;
            }

            setPendingReference(reference);
            setCheckoutUrl(authorizationUrl);
            setCheckoutModalVisible(true);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Checkout failed',
                text2: error.response?.data?.message || error.message || 'Something went wrong',
            });
        }
    };

    if (cartQuery.isLoading) {
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
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Checkout</Text>
                    <View className="w-6" />
                </View>

                <View className="flex-row px-6 mb-6">
                    <TouchableOpacity
                        onPress={() => setActiveTab('Your Order')}
                        className={`flex-1 pb-2 items-center border-b-2 ${activeTab === 'Your Order' ? 'border-[#4CAF50]' : 'border-transparent'}`}
                    >
                        <Text className={`font-satoshi font-bold text-[14px] ${activeTab === 'Your Order' ? 'text-[#4CAF50]' : 'text-[#9E9E9E]'}`}>
                            Your Order
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('Delivery & Payment')}
                        className={`flex-1 pb-2 items-center border-b-2 ${activeTab === 'Delivery & Payment' ? 'border-[#4CAF50]' : 'border-transparent'}`}
                    >
                        <Text className={`font-satoshi font-bold text-[14px] ${activeTab === 'Delivery & Payment' ? 'text-[#4CAF50]' : 'text-[#9E9E9E]'}`}>
                            Delivery & Payment
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
                    {activeTab === 'Your Order' ? (
                        <>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Cart Items</Text>
                            </View>

                            {items.length === 0 ? (
                                <View className="items-center justify-center py-20">
                                    <Text className="text-gray-400 font-satoshi">Your cart is empty.</Text>
                                </View>
                            ) : (
                                items.map((item) => (
                                    <View key={item.id} className="flex-row items-center mb-6">
                                        <Image
                                            source={{ uri: item.food?.media?.url || item.product?.media?.url || 'https://via.placeholder.com/100' }}
                                            className="w-14 h-14 rounded-lg mr-4"
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-[15px] font-satoshi font-bold text-[#424242]">
                                                    {item.food?.name || item.product?.name || 'Food Item'}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => setProductQuantity(getProductIdFromCartItem(item), 0)}
                                                    className="bg-red-50 p-1 rounded-md ml-2"
                                                >
                                                    <Ionicons name="trash-outline" size={14} color="#F44336" />
                                                </TouchableOpacity>
                                            </View>
                                            <Text className="text-[11px] font-satoshi text-[#9E9E9E] mb-1">
                                                ₦{(item.food?.price || item.product?.price || 0).toLocaleString()} per item
                                            </Text>
                                            <View className="flex-row items-center justify-between">
                                                <View>
                                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">Total</Text>
                                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">
                                                        ₦{(item.line_total || ((item.food?.price || item.product?.price || 0) * item.quantity)).toLocaleString()}
                                                    </Text>
                                                </View>
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
                                                            setProductQuantity(
                                                                getProductIdFromCartItem(item),
                                                                item.quantity + 1
                                                            )
                                                        }
                                                    >
                                                        <Ionicons name="add" size={16} color="#424242" />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </>
                    ) : (
                        <View className="pb-10">
                            <View className="space-y-4 mb-8">
                                <View className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4 mb-4">
                                    <Ionicons name="location-outline" size={18} color="#9E9E9E" />
                                    <TextInput
                                        placeholder="Delivery Address"
                                        value={deliveryAddress}
                                        onChangeText={setDeliveryAddress}
                                        className="flex-1 ml-3 font-satoshi text-sm"
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                                <View className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex-row items-center px-4">
                                    <Ionicons name="bicycle-outline" size={18} color="#9E9E9E" />
                                    <TextInput
                                        placeholder="Note for the rider"
                                        value={riderNote}
                                        onChangeText={setRiderNote}
                                        className="flex-1 ml-3 font-satoshi text-sm"
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                            </View>

                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Delivery Time</Text>
                            <View className="bg-white border border-gray-100 rounded-xl p-4 mb-8 shadow-sm">
                                <TouchableOpacity
                                    onPress={() => setDeliveryType('NOW')}
                                    className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-50"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="flash-outline" size={18} color="#424242" />
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Deliver Now</Text>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${deliveryType === 'NOW' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {deliveryType === 'NOW' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setDeliveryType('SCHEDULED');
                                        setShowDateTimePicker(true);
                                    }}
                                    className="flex-row items-center justify-between"
                                >
                                    <View className="flex-1">
                                        <View className="flex-row items-center">
                                            <Ionicons name="calendar-outline" size={18} color="#424242" />
                                            <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Schedule Delivery</Text>
                                        </View>
                                        {deliveryType === 'SCHEDULED' && (
                                            <Text className="ml-9 mt-1 text-[#9E9E9E] font-satoshi text-[11px]">
                                                {formatDateTime(scheduledFor)}
                                            </Text>
                                        )}
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${deliveryType === 'SCHEDULED' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {deliveryType === 'SCHEDULED' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {showDateTimePicker && (
                                <DateTimePicker
                                    mode="datetime"
                                    value={scheduledFor}
                                    minimumDate={new Date(Date.now() + 60 * 1000)}
                                    onChange={handleDateTimeChange}
                                />
                            )}

                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Payment Summary</Text>
                            <View className="bg-gray-50 p-4 rounded-xl mb-8">
                                <View className="space-y-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-[#9E9E9E] font-satoshi text-sm">Sub-total ({items.length} items)</Text>
                                        <Text className="text-[#424242] font-satoshi font-bold text-sm">₦{subTotal.toLocaleString()}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-[#9E9E9E] font-satoshi text-sm">Discount</Text>
                                        <Text className="text-[#4CAF50] font-satoshi font-bold text-sm">-₦{totalDiscount.toLocaleString()}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-[#9E9E9E] font-satoshi text-sm">Delivery Fee</Text>
                                        <Text className="text-[#424242] font-satoshi font-bold text-sm">₦0.00</Text>
                                    </View>
                                    <View className="h-[1px] bg-gray-200 my-2" />
                                    <View className="flex-row justify-between">
                                        <Text className="text-[#424242] font-satoshi font-bold text-[16px]">Total</Text>
                                        <Text className="text-[#424242] font-satoshi font-bold text-[16px]">₦{totalPrice.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>

                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Payment Method</Text>
                            <View className="space-y-4 mb-6">
                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('WALLET')}
                                    className="bg-white border border-gray-100 p-4 rounded-xl flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="wallet-outline" size={20} color="#424242" />
                                        <View className="ml-3">
                                            <Text className="font-satoshi font-bold text-[#424242] text-sm">Wallet</Text>
                                            <Text className="font-satoshi text-[10px] text-[#9E9E9E]">Pay from your Grovine wallet</Text>
                                        </View>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'WALLET' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {paymentMethod === 'WALLET' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('ONLINE')}
                                    className="bg-white border border-gray-100 p-4 rounded-xl flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="card-outline" size={20} color="#424242" />
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Pay Online (Paystack)</Text>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'ONLINE' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {paymentMethod === 'ONLINE' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setPaymentMethod('PAY_FOR_ME')}
                                    className="bg-white border border-gray-100 p-4 rounded-xl flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="people-outline" size={20} color="#424242" />
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Pay for me</Text>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'PAY_FOR_ME' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {paymentMethod === 'PAY_FOR_ME' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View className="px-6 py-6 bg-white border-t border-[#EEEEEE]">
                    <TouchableOpacity
                        onPress={() => activeTab === 'Your Order' ? setActiveTab('Delivery & Payment') : handlePlaceOrder()}
                        disabled={!canSubmit}
                        className={`h-14 rounded-2xl items-center justify-center ${canSubmit ? 'bg-[#4CAF50]' : 'bg-gray-300'}`}
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">{checkoutButtonTitle}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={checkoutModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setCheckoutModalVisible(false)}
            >
                <ScreenWrapper bg="#FFFFFF">
                    <View className="flex-1">
                        <View className="px-6 pt-20 pb-4 flex-row items-center justify-between border-b border-gray-100">
                            <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#424242" />
                            </TouchableOpacity>
                            <Text className="text-[17px] font-satoshi font-bold text-[#424242]">Complete Payment</Text>
                            <View className="w-6" />
                        </View>

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
                    </View>
                </ScreenWrapper>
            </Modal>

            <Modal
                visible={verifyModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setVerifyModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-8">
                    <View className="bg-white rounded-2xl p-6 w-full">
                        <View className="items-center mb-4">
                            {verifyStatus === 'verifying' ? (
                                <ActivityIndicator size="large" color="#4CAF50" />
                            ) : (
                                <Ionicons
                                    name={verifyStatus === 'success' ? 'checkmark-circle' : 'close-circle'}
                                    size={56}
                                    color={verifyStatus === 'success' ? '#4CAF50' : '#F44336'}
                                />
                            )}
                        </View>
                        <Text className="text-center text-[16px] font-satoshi font-bold text-[#424242] mb-2">
                            {verifyStatus === 'verifying'
                                ? 'Verifying Payment'
                                : verifyStatus === 'success'
                                    ? 'Payment Successful'
                                    : 'Payment Failed'}
                        </Text>
                        <Text className="text-center text-[13px] font-satoshi text-[#757575] mb-6">
                            {verifyMessage}
                        </Text>
                        {verifyStatus !== 'verifying' && (
                            <TouchableOpacity
                                onPress={() => {
                                    setVerifyModalVisible(false);
                                    goToOrdersTab();
                                }}
                                className="h-12 bg-[#4CAF50] rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-satoshi font-bold text-[14px]">View Orders</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};
