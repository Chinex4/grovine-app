import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/colors';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    className = '',
    icon,
    iconPosition = 'left'
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return 'bg-primary';
            case 'secondary':
                return 'bg-secondary';
            case 'outline':
                return 'border border-primary bg-transparent';
            case 'ghost':
                return 'bg-transparent';
            default:
                return 'bg-primary';
        }
    };

    const getTextStyles = () => {
        switch (variant) {
            case 'outline':
                return 'text-primary';
            case 'ghost':
                return 'text-primary';
            default:
                return 'text-white';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            <View className={`h-14 rounded-2xl flex-row items-center justify-center px-6 ${getVariantStyles()} ${disabled ? 'opacity-50' : ''} ${className}`}>
                {loading ? (
                    <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : 'white'} />
                ) : (
                    <>
                        {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
                        <Text className={`text-lg font-bold ${getTextStyles()}`}>{title}</Text>
                        {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
                    </>
                )}
            </View>
        </TouchableOpacity>
    );
};
