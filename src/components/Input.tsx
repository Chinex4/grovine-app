import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerStyle?: string;
    className?: string;
    isPhone?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    containerStyle = '',
    className,
    isPhone,
    ...props
}) => {
    return (
        <View className={`mb-4 ${containerStyle} ${className || ''}`}>
            {label && (
                <Text className="text-gray-700 text-sm font-semibold mb-2 ml-1">
                    {label}
                </Text>
            )}
            <View
                className={`h-14 flex-row items-center px-4 rounded-xl bg-[#EEEEEE] border ${error ? 'border-error' : 'border-transparent'}`}
            >
                {icon && <View className="mr-3">{icon}</View>}
                <TextInput
                    className="flex-1 text-base text-gray-900 font-satoshi"
                    placeholderTextColor="#9E9E9E"
                    {...props}
                />
                {isPhone && (
                    <View className="flex-row items-center ml-2 pl-2 border-l border-gray-300">
                        <Ionicons name="chevron-down" size={16} color="#424242" className="mr-1" />
                        <Text className="text-2xl">🇳🇬</Text>
                    </View>
                )}
            </View>
            {error && (
                <Text className="text-error text-xs mt-1 ml-1">
                    {error}
                </Text>
            )}
        </View>
    );
};
