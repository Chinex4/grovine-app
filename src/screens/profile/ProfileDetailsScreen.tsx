import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { LogOut, Trash2, ChevronRight } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../utils/userService';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';
import { clearAccessToken } from '../../utils/api';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseApiDate = (value: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const ProfileDetailsScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [dobDate, setDobDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [address, setAddress] = useState('');

    const { data: meResponse, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: userService.getMe,
    });

    useEffect(() => {
        const user = meResponse?.data;
        if (!user) return;

        setName(user.name || '');
        setUsername(user.username || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        const parsedDob = parseApiDate(user.date_of_birth || '');
        if (parsedDob) {
            setDobDate(parsedDob);
            setDateOfBirth(formatDateForApi(parsedDob));
        } else {
            setDateOfBirth('');
        }
        setAddress(user.address || '');
    }, [meResponse]);

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'set' && selectedDate) {
            setDobDate(selectedDate);
            setDateOfBirth(formatDateForApi(selectedDate));
        }
    };

    const updateMutation = useMutation({
        mutationFn: userService.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            Toast.show({
                type: 'success',
                text1: 'Profile updated',
            });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: error.response?.data?.message || error.message || 'Could not update profile',
            });
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: userService.deleteAccount,
        onSuccess: async () => {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
            clearAccessToken();
            dispatch(logout());
            queryClient.clear();
            Toast.show({ type: 'success', text1: 'Account deleted' });
            navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
            });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Delete failed',
                text2: error.response?.data?.message || error.message || 'Could not delete account',
            });
        },
    });

    const handleSave = () => {
        updateMutation.mutate({
            name: name.trim(),
            username: username.trim(),
            phone: phone.trim(),
            email: email.trim(),
            date_of_birth: dateOfBirth.trim(),
            address: address.trim(),
        });
    };

    const handleSignOut = async () => {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        clearAccessToken();
        dispatch(logout());
        queryClient.clear();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
        });
    };

    if (isLoading) {
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <View className="flex-1">
                    <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Profile Details</Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView
                        className="flex-1 px-6 pt-8"
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Account name</Text>
                            <View className="bg-gray-100 rounded-2xl px-4 h-12 justify-center">
                                <TextInput value={name} onChangeText={setName} className="text-[14px] font-satoshi text-[#424242]" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Username</Text>
                            <View className="bg-gray-100 rounded-2xl px-4 h-12 justify-center">
                                <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" className="text-[14px] font-satoshi text-[#424242]" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Phone number</Text>
                            <View className="bg-gray-100 rounded-2xl px-4 h-12 justify-center">
                                <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" className="text-[14px] font-satoshi text-[#424242]" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Email</Text>
                            <View className="bg-gray-100 rounded-2xl px-4 h-12 justify-center">
                                <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" className="text-[14px] font-satoshi text-[#424242]" />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Date of birth</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="bg-gray-100 rounded-2xl px-4 h-12 justify-center"
                            >
                                <Text className={`text-[14px] font-satoshi ${dateOfBirth ? 'text-[#424242]' : 'text-[#9E9E9E]'}`}>
                                    {dateOfBirth || 'Select date'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Text className="text-[12px] font-satoshi font-bold text-[#424242] mb-2">Address</Text>
                            <View className="bg-gray-100 rounded-2xl px-4 py-3 min-h-14">
                                <TextInput
                                    value={address}
                                    onChangeText={setAddress}
                                    multiline
                                    placeholder="Lagos, Nigeria"
                                    className="text-[14px] font-satoshi text-[#424242]"
                                />
                            </View>
                        </View>

                        <View className="mt-6">
                            <TouchableOpacity onPress={handleSignOut} className="flex-row items-center py-4 border-b border-gray-100">
                                <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                    <LogOut size={18} color="#424242" />
                                </View>
                                <Text className="flex-1 font-satoshi font-bold text-[#424242] text-[15px]">Sign out</Text>
                                <ChevronRight size={18} color="#BDBDBD" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => deleteAccountMutation.mutate()}
                                disabled={deleteAccountMutation.isPending}
                                className="flex-row items-center py-4 border-b border-gray-100"
                            >
                                <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                    <Trash2 size={18} color="#F44336" />
                                </View>
                                <Text className="flex-1 font-satoshi font-bold text-[#F44336] text-[15px]">
                                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete account'}
                                </Text>
                                <ChevronRight size={18} color="#BDBDBD" />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View className="px-6 py-6 bg-white border-t border-gray-50">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={updateMutation.isPending}
                            className={`h-14 rounded-2xl items-center justify-center ${updateMutation.isPending ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'}`}
                        >
                            {updateMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-satoshi font-bold text-[16px]">Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {showDatePicker && Platform.OS === 'android' ? (
                <DateTimePicker
                    value={dobDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                />
            ) : null}

            {showDatePicker && Platform.OS === 'ios' ? (
                <View className="absolute inset-0 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-5">
                        <View className="flex-row items-center justify-between mb-3">
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text className="font-satoshi text-[#9E9E9E] text-[14px]">Cancel</Text>
                            </TouchableOpacity>
                            <Text className="font-satoshi font-bold text-[#424242] text-[15px]">Select Date of Birth</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text className="font-satoshi text-[#4CAF50] text-[14px] font-bold">Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={dobDate}
                            mode="date"
                            display="spinner"
                            maximumDate={new Date()}
                            onChange={handleDateChange}
                        />
                    </View>
                </View>
            ) : null}
        </ScreenWrapper>
    );
};
