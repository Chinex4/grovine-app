import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService, CheckoutParams } from '../../utils/cartService';
import Toast from 'react-native-toast-message';

export const CheckoutScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState('Your Order');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [riderNote, setRiderNote] = useState('');
    const [deliveryType, setDeliveryType] = useState('NOW');
    const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'WALLET' | 'PAY_FOR_ME'>('ONLINE');

    const queryClient = useQueryClient();

    const { data: cartResponse, isLoading: isCartLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
    });

    const updateCartMutation = useMutation({
        mutationFn: ({ id, quantity }: { id: string, quantity: number }) =>
            cartService.updateCart(id, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error.response?.data?.message || 'Could not update quantity'
            });
        }
    });

    const checkoutMutation = useMutation({
        mutationFn: (params: CheckoutParams) => cartService.checkout(params),
        onSuccess: (data) => {
            Toast.show({ type: 'success', text1: 'Order placed successfully' });
            // If there's a payment URL, we might want to navigate to a WebView
            // For now, let's go back or to Orders
            navigation.navigate('Orders');
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Checkout failed',
                text2: error.response?.data?.message || 'Something went wrong'
            });
        }
    });

    const cart = cartResponse?.data;
    const items = cart?.items || [];
    const totalPrice = cart?.total || 0;

    const handlePlaceOrder = () => {
        if (!deliveryAddress) {
            Toast.show({ type: 'error', text1: 'Please enter a delivery address' });
            setActiveTab('Delivery & Payment');
            return;
        }

        const params: CheckoutParams = {
            delivery: {
                type: deliveryType,
                address: deliveryAddress,
                note_for_rider: riderNote,
            },
            payment_method: paymentMethod,
        };

        checkoutMutation.mutate(params);
    };

    if (isCartLoading) {
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
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Checkout</Text>
                    <View className="w-6" />
                </View>

                {/* Switcher */}
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

                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Order Summary</Text>

                            {items.length === 0 ? (
                                <View className="items-center justify-center py-20">
                                    <Text className="text-gray-400 font-satoshi">Your cart is empty.</Text>
                                </View>
                            ) : (
                                items.map((item) => (
                                    <View key={item.id} className="flex-row items-center mb-6">
                                        <Image
                                            source={{ uri: item.food?.media?.url || 'https://via.placeholder.com/100' }}
                                            className="w-14 h-14 rounded-lg mr-4"
                                        />
                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between">
                                                <Text className="text-[15px] font-satoshi font-bold text-[#424242]">{item.food?.name || 'Food Item'}</Text>
                                                <TouchableOpacity
                                                    onPress={() => updateCartMutation.mutate({ id: item.food_id, quantity: 0 })}
                                                    className="bg-red-50 p-1 rounded-md ml-2"
                                                >
                                                    <Ionicons name="trash-outline" size={14} color="#F44336" />
                                                </TouchableOpacity>
                                            </View>
                                            <Text className="text-[11px] font-satoshi text-[#9E9E9E] mb-1">
                                                NGN {item.food?.price?.toLocaleString() || '0'} per item
                                            </Text>
                                            <View className="flex-row items-center justify-between">
                                                <View>
                                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">Total</Text>
                                                    <Text className="text-[12px] font-satoshi font-bold text-[#424242]">
                                                        NGN {((item.food?.price || 0) * item.quantity).toLocaleString()}
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center bg-gray-100 rounded-lg px-2 py-1">
                                                    <TouchableOpacity
                                                        disabled={updateCartMutation.isPending}
                                                        onPress={() => updateCartMutation.mutate({ id: item.food_id, quantity: Math.max(0, item.quantity - 1) })}
                                                    >
                                                        <Ionicons name="remove" size={16} color="#424242" />
                                                    </TouchableOpacity>
                                                    <Text className="mx-3 font-satoshi font-bold text-[14px]">{item.quantity}</Text>
                                                    <TouchableOpacity
                                                        disabled={updateCartMutation.isPending}
                                                        onPress={() => updateCartMutation.mutate({ id: item.food_id, quantity: item.quantity + 1 })}
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
                            {/* Alert */}
                            <View className="bg-[#4CAF50]/10 p-3 rounded-lg flex-row items-center mb-6">
                                <Ionicons name="alert-circle-outline" size={18} color="#4CAF50" />
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px] ml-2">
                                    Delivery requires confirmation PIN
                                </Text>
                            </View>

                            {/* Inputs */}
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

                            {/* Delivery Time */}
                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Select Available Delivery Time</Text>
                            <View className="bg-white border inset-0 border-gray-100 rounded-xl p-4 mb-8 shadow-sm">
                                <TouchableOpacity
                                    onPress={() => setDeliveryType('NOW')}
                                    className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-50"
                                >
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={18} color="#424242" />
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Deliver Now</Text>
                                    </View>
                                    <View className={`w-5 h-5 rounded-full border-2 ${deliveryType === 'NOW' ? 'border-[#4CAF50] items-center justify-center' : 'border-gray-300'}`}>
                                        {deliveryType === 'NOW' && <View className="w-3 h-3 rounded-full bg-[#4CAF50]" />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                        <Ionicons name="calendar-outline" size={18} color="#424242" />
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Schedule Delivery</Text>
                                    </View>
                                    <View className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                </TouchableOpacity>
                            </View>

                            {/* Payment Summary */}
                            <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Payment Summary</Text>
                            <View className="bg-gray-50 p-4 rounded-xl mb-8">
                                <TouchableOpacity className="flex-row items-center mb-4">
                                    <Ionicons name="ticket-outline" size={18} color="#424242" />
                                    <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Use Promo Code</Text>
                                </TouchableOpacity>
                                <View className="space-y-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-[#9E9E9E] font-satoshi text-sm">Sub-total ({items.length} items)</Text>
                                        <Text className="text-[#424242] font-satoshi font-bold text-sm">₦{totalPrice.toLocaleString()}</Text>
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

                            {/* Payment Method */}
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
                                        <Text className="ml-3 font-satoshi font-bold text-[#424242] text-sm">Pay Online</Text>
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

                            {/* Terms */}
                            <Text className="text-center text-[10px] text-[#9E9E9E] font-satoshi leading-[14px] px-4">
                                By proceeding, you agree to our{" "}
                                <Text className="text-[#4CAF50] underline">Terms Of Use</Text>{"\n"}
                                and <Text className="text-[#4CAF50] underline">Privacy Policy</Text>
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View className="px-6 py-6 bg-white border-t border-[#EEEEEE]">
                    <TouchableOpacity
                        onPress={() => activeTab === 'Your Order' ? setActiveTab('Delivery & Payment') : handlePlaceOrder()}
                        disabled={checkoutMutation.isPending || (activeTab === 'Your Order' && items.length === 0)}
                        className={`h-14 rounded-2xl items-center justify-center ${items.length === 0 && activeTab === 'Your Order' ? 'bg-gray-300' : 'bg-[#4CAF50]'}`}
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">
                            {checkoutMutation.isPending ? 'Processing...' : (activeTab === 'Your Order' ? `Checkout - ₦${totalPrice.toLocaleString()}` : 'Place Order')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};

const ChevronRight = ({ size, color }: any) => (
    <Ionicons name="chevron-forward" size={size} color={color} />
);
