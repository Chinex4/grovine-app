import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { User, Share2, Gift, Bell, HelpCircle, MessageSquare, Shield, ChevronRight, LogOut, Trash2 } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../utils/userService';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { clearAccessToken } from '../../utils/api';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { appStorage } from '../../utils/appStorage';
import { STORAGE_KEYS } from '../../constants/storageKeys';

type ProfileMenuSection = {
    title: string;
    items: { icon: React.ReactNode; title: string }[];
};

const BASE_MENU_SECTIONS: ProfileMenuSection[] = [
    {
        title: 'Personal',
        items: [
            { icon: <User size={18} color="#424242" />, title: 'Profile Details' },
        ],
    },
    {
        title: 'Services',
        items: [
            { icon: <Ionicons name="heart-outline" size={18} color="#424242" />, title: 'Saved Products' },
            { icon: <Share2 size={18} color="#424242" />, title: 'Referrals' },
            { icon: <Gift size={18} color="#424242" />, title: 'Gift Cards' },
        ],
    },
    {
        title: 'More',
        items: [
            { icon: <Bell size={18} color="#424242" />, title: "What's New" },
            { icon: <HelpCircle size={18} color="#424242" />, title: 'FAQs' },
            { icon: <MessageSquare size={18} color="#424242" />, title: 'Support' },
            { icon: <Shield size={18} color="#424242" />, title: 'Legal' },
        ],
    },
];

const extractChefNiches = (chef: any): string[] => {
    if (!chef) return [];

    const toName = (item: any) => {
        if (!item) return '';
        if (typeof item === 'string') return item.trim();
        if (typeof item?.name === 'string') return item.name.trim();
        if (typeof item?.title === 'string') return item.title.trim();
        return '';
    };

    const nicheNames: string[] = [];

    const arrayCandidates = [chef?.niches, chef?.chef_niches, chef?.niche_names];
    arrayCandidates.forEach((candidate) => {
        if (Array.isArray(candidate)) {
            candidate.forEach((item) => {
                const name = toName(item);
                if (name) nicheNames.push(name);
            });
        }
    });

    const singleCandidates = [chef?.chef_niche, chef?.chefNiche, chef?.niche];
    singleCandidates.forEach((candidate) => {
        const name = toName(candidate);
        if (name) nicheNames.push(name);
    });

    const scalarCandidates = [chef?.niche_name, chef?.chef_niche_name];
    scalarCandidates.forEach((candidate) => {
        if (typeof candidate === 'string' && candidate.trim()) {
            nicheNames.push(candidate.trim());
        }
    });

    return [...new Set(nicheNames)];
};

export const ProfileScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string; name: string } | null>(null);

    const { data: meResponse, isLoading } = useQuery({
        queryKey: ['me'],
        queryFn: userService.getMe,
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: (imageFile: { uri: string; type: string; name: string }) => userService.uploadProfilePicture(imageFile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] });
            setSelectedImage(null);
            setIsPhotoModalOpen(false);
            Toast.show({
                type: 'success',
                text1: 'Profile photo updated',
            });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Upload failed',
                text2: error.response?.data?.message || error.message || 'Could not update profile photo',
            });
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: userService.deleteAccount,
        onSuccess: async () => {
            await appStorage.removeItem(STORAGE_KEYS.accessToken);
            await appStorage.removeItem(STORAGE_KEYS.refreshToken);
            clearAccessToken();
            dispatch(logout());
            queryClient.clear();
            Toast.show({
                type: 'success',
                text1: 'Account deleted',
            });
            navigation.reset({
                index: 0,
                routes: [{ name: 'AppSplash' }],
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

    const user = meResponse?.data;
    const fullName = user?.name || 'User';
    const avatarUri = user?.profile_picture?.url?.trim();
    const hasValidAvatar = !!avatarUri && avatarUri !== 'null' && avatarUri !== 'undefined';
    const isChef = String(user?.role || '').toLowerCase() === 'chef';
    const chefNiches = useMemo(() => extractChefNiches(user?.chef), [user?.chef]);

    const menuSections = useMemo<ProfileMenuSection[]>(() => {
        const sections: ProfileMenuSection[] = [...BASE_MENU_SECTIONS];

        if (isChef) {
            sections.splice(1, 0, {
                title: 'Chef',
                items: [
                    { icon: <Ionicons name="videocam-outline" size={18} color="#424242" />, title: 'Recipes' },
                    { icon: <Ionicons name="add-circle-outline" size={18} color="#424242" />, title: 'Add New Recipe' },
                ],
            });
        }

        return sections;
    }, [isChef]);

    const handlePickFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Toast.show({
                type: 'error',
                text1: 'Permission required',
                text2: 'Please allow photo library access to continue.',
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) {
            return;
        }

        const asset = result.assets[0];
        setSelectedImage({
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || `profile-${Date.now()}.jpg`,
        });
    };

    const handleUploadPhoto = () => {
        if (!selectedImage) {
            Toast.show({
                type: 'error',
                text1: 'Select a photo first',
            });
            return;
        }
        uploadPhotoMutation.mutate(selectedImage);
    };

    const handleSignOut = async () => {
        await appStorage.removeItem(STORAGE_KEYS.accessToken);
        await appStorage.removeItem(STORAGE_KEYS.refreshToken);
        clearAccessToken();
        dispatch(logout());
        queryClient.clear();
        navigation.reset({
            index: 0,
            routes: [{ name: 'AppSplash' }],
        });
    };

    if (isLoading) {
        return (
            <ScreenWrapper bg="#FFFFFF">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#FFFFFF">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    className="flex-1"
                >
                    <View className="relative h-44">
                        <Image
                            source={require('../../assets/images/banner.png')}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="absolute top-10 left-6 w-8 h-8 rounded-full bg-white/20 items-center justify-center"
                        >
                            <Ionicons name="arrow-back" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="px-6 -mt-12 mb-6">
                        <View className="flex-row items-end justify-between">
                            <View className="relative">
                                <Image
                                    source={hasValidAvatar ? { uri: avatarUri } : require('../../assets/images/3d_avatar_3.png')}
                                    className="w-24 h-24 rounded-full border-4 border-white"
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedImage(null);
                                        setIsPhotoModalOpen(true);
                                    }}
                                    className="absolute bottom-0 right-0 bg-[#4CAF50] w-6 h-6 rounded-full border-2 border-white items-center justify-center"
                                >
                                    <Ionicons name="pencil-outline" size={12} color="white" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('WalletPayment')}
                                className="bg-[#4CAF50] px-4 py-2 rounded-lg flex-row items-center mb-1"
                            >
                                <Text className="text-white font-satoshi font-bold text-[10px] mr-2">View Wallet</Text>
                                <Ionicons name="wallet-outline" size={14} color="white" />
                            </TouchableOpacity>
                        </View>

                        <View className="mt-4">
                            <Text className="text-[22px] font-satoshi font-bold text-[#424242] mr-3">{fullName}</Text>
                            <Text className="text-[#9E9E9E] font-satoshi text-[13px] mt-1">{user?.email || ''}</Text>
                        </View>

                        {isChef ? (
                            <View className="mt-6">
                                <View className="bg-[#E8F5E9] border border-[#4CAF50]/30 py-3 px-4 rounded-xl flex-row items-center self-start">
                                    <View className="w-8 h-8 rounded-full bg-[#4CAF50] items-center justify-center mr-3">
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </View>
                                    <Text className="text-[#2E7D32] font-satoshi font-bold text-[14px]">Chef Account Active</Text>
                                </View>
                                {chefNiches.length > 0 ? (
                                    <View className="mt-3 flex-row flex-wrap">
                                        {chefNiches.map((niche, index) => (
                                            <View
                                                key={`${niche}-${index}`}
                                                className={`px-3 py-1.5 rounded-lg mr-2 mb-2 border ${
                                                    index % 3 === 0
                                                        ? 'bg-[#8B5E3C] border-[#8B5E3C]'
                                                        : index % 3 === 1
                                                            ? 'bg-[#8FAF5B] border-[#8FAF5B]'
                                                            : 'bg-[#424242] border-[#424242]'
                                                }`}
                                            >
                                                <Text className="text-white font-satoshi font-bold text-[12px]">{niche}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('ChefSignup')}
                                className="mt-6 bg-[#4CAF50]/10 border border-[#4CAF50]/30 py-3 px-4 rounded-xl flex-row items-center self-start"
                            >
                                <View className="w-8 h-8 rounded-full bg-[#4CAF50] items-center justify-center mr-3">
                                    <Ionicons name="restaurant" size={16} color="white" />
                                </View>
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[14px]">Create A Chef Account</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {menuSections.map((section) => (
                        <View key={section.title} className="px-6 mb-8">
                            <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px] mb-4">{section.title}</Text>
                            <View className="bg-white">
                                {section.items.map((item, iIndex) => (
                                    <TouchableOpacity
                                        key={item.title}
                                        onPress={() => {
                                            const routeMap: {
                                                [key: string]: { name: string; params?: Record<string, any> };
                                            } = {
                                                'Profile Details': { name: 'ProfileDetails' },
                                                'Saved Products': { name: 'SavedProducts' },
                                                'Referrals': { name: 'Referrals' },
                                                'Gift Cards': { name: 'GiftCards' },
                                                'Recipes': { name: 'ManageVideos' },
                                                'Add New Recipe': { name: 'UploadVideo', params: { resetDraft: true } },
                                                "What's New": { name: 'WhatsNew' },
                                                'FAQs': { name: 'Faqs' },
                                                'Support': { name: 'Support' },
                                                'Legal': { name: 'Legal' },
                                            };
                                            const route = routeMap[item.title];
                                            if (route) {
                                                navigation.navigate(route.name, route.params);
                                            }
                                        }}
                                        className={`flex-row items-center py-4 border-b border-gray-100 ${iIndex === section.items.length - 1 ? 'border-b-0' : ''}`}
                                    >
                                        <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                            {item.icon}
                                        </View>
                                        <Text className="flex-1 font-satoshi font-bold text-[#424242] text-[15px]">{item.title}</Text>
                                        <ChevronRight size={18} color="#BDBDBD" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    <View className="px-6 mb-8">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px] mb-4">Account</Text>
                        <View className="bg-white">
                            <TouchableOpacity
                                onPress={handleSignOut}
                                className="flex-row items-center py-4 border-b border-gray-100"
                            >
                                <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                    <LogOut size={18} color="#424242" />
                                </View>
                                <Text className="flex-1 font-satoshi font-bold text-[#424242] text-[15px]">Logout</Text>
                                <ChevronRight size={18} color="#BDBDBD" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => deleteAccountMutation.mutate()}
                                disabled={deleteAccountMutation.isPending}
                                className="flex-row items-center py-4"
                            >
                                <View className="w-10 h-10 items-center justify-center bg-gray-50 rounded-xl mr-4">
                                    <Trash2 size={18} color="#F44336" />
                                </View>
                                <Text className="flex-1 font-satoshi font-bold text-[#F44336] text-[15px]">
                                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                                </Text>
                                <ChevronRight size={18} color="#BDBDBD" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="py-10 items-center">
                        <Text className="text-[#BDBDBD] font-satoshi text-[12px]">v1.0.50(v957)</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal
                visible={isPhotoModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsPhotoModalOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1 justify-end bg-black/50"
                >
                    <View className="bg-white px-6 pt-6 pb-8 rounded-t-3xl">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="font-satoshi font-bold text-[18px] text-[#424242]">Update Profile Photo</Text>
                            <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                                <Ionicons name="close" size={22} color="#9E9E9E" />
                            </TouchableOpacity>
                        </View>
                        <View className="items-center mb-5">
                            <Image
                                source={
                                    selectedImage?.uri
                                        ? { uri: selectedImage.uri }
                                        : hasValidAvatar
                                            ? { uri: avatarUri }
                                            : require('../../assets/images/3d_avatar_3.png')
                                }
                                className="w-24 h-24 rounded-full border border-gray-200"
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handlePickFromGallery}
                            className="h-12 rounded-xl items-center justify-center bg-gray-100 border border-gray-200 mb-3"
                        >
                            <Text className="font-satoshi font-bold text-[14px] text-[#424242]">Choose From Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleUploadPhoto}
                            disabled={uploadPhotoMutation.isPending || !selectedImage}
                            className={`h-12 rounded-xl items-center justify-center ${uploadPhotoMutation.isPending || !selectedImage ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'}`}
                        >
                            {uploadPhotoMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-satoshi font-bold text-[14px]">Upload Photo</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
};
