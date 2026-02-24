import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { User, MapPin, Share2, Gift, Bell, HelpCircle, MessageSquare, Shield, ChevronRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const MENU_SECTIONS = [
    {
        title: 'Personal',
        items: [
            { icon: <User size={18} color="#424242" />, title: 'Profile Details' },
            { icon: <MapPin size={18} color="#424242" />, title: 'Address' },
        ]
    },
    {
        title: 'Services',
        items: [
            { icon: <Share2 size={18} color="#424242" />, title: 'Referrals' },
            { icon: <Gift size={18} color="#424242" />, title: 'Gift Cards' },
        ]
    },
    {
        title: 'More',
        items: [
            { icon: <Bell size={18} color="#424242" />, title: "What's New" },
            { icon: <HelpCircle size={18} color="#424242" />, title: 'FAQs' },
            { icon: <MessageSquare size={18} color="#424242" />, title: 'Support' },
            { icon: <Shield size={18} color="#424242" />, title: 'Legal' },
        ]
    }
];

export const ProfileScreen = ({ navigation }: any) => {
    return (
        <ScreenWrapper bg="#FFFFFF">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header Banner */}
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

                {/* Profile Section */}
                <View className="px-6 -mt-12 mb-6">
                    <View className="flex-row items-end justify-between">
                        <View className="relative">
                            <Image
                                source={require('../../assets/images/3d_avatar_3.png')}
                                className="w-24 h-24 rounded-full border-4 border-white"
                            />
                            <TouchableOpacity className="absolute bottom-0 right-0 bg-[#4CAF50] w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                                <Ionicons name="pencil-outline" size={12} color="white" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('TransactionHistory')}
                            className="bg-[#4CAF50] px-4 py-2 rounded-lg flex-row items-center mb-1"
                        >
                            <Text className="text-white font-satoshi font-bold text-[10px] mr-2">View Wallet</Text>
                            <Ionicons name="wallet-outline" size={14} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="mt-4 flex-row items-center">
                        <Text className="text-[22px] font-satoshi font-bold text-[#424242] mr-3">Craig Orisa</Text>
                        <View className="bg-[#8B5E3C] px-2 py-1 rounded-md flex-row items-center">
                            <Ionicons name="star" size={10} color="#FFD700" />
                            <Text className="text-white font-satoshi font-bold text-[8px] ml-1 uppercase">VIP User</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChefSignup')}
                        className="mt-6 bg-[#4CAF50]/10 border border-[#4CAF50]/30 py-3 px-4 rounded-xl flex-row items-center self-start"
                    >
                        <View className="w-8 h-8 rounded-full bg-[#4CAF50] items-center justify-center mr-3">
                            <Ionicons name="restaurant" size={16} color="white" />
                        </View>
                        <Text className="text-[#4CAF50] font-satoshi font-bold text-[14px]">Create A Chef Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Sections */}
                {MENU_SECTIONS.map((section, sIndex) => (
                    <View key={section.title} className="px-6 mb-8">
                        <Text className="text-[#9E9E9E] font-satoshi font-bold text-[14px] mb-4">{section.title}</Text>
                        <View className="bg-white">
                            {section.items.map((item, iIndex) => (
                                <TouchableOpacity
                                    key={item.title}
                                    onPress={() => {
                                        const routeMap: { [key: string]: string } = {
                                            'Profile Details': 'ProfileDetails',
                                            'Address': 'Address',
                                            'Referrals': 'Referrals',
                                        };
                                        const routeName = routeMap[item.title];
                                        if (routeName) {
                                            navigation.navigate(routeName);
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

                {/* Version */}
                <View className="py-10 items-center">
                    <Text className="text-[#BDBDBD] font-satoshi text-[12px]">v1.0.50(v957)</Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};
