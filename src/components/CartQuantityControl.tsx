import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

interface CartQuantityControlProps {
    quantity: number;
    onAdd: () => void;
    onIncrement: () => void;
    onDecrement: () => void;
    disabled?: boolean;
    loading?: boolean;
    compact?: boolean;
}

export const CartQuantityControl = ({
    quantity,
    onAdd,
    onIncrement,
    onDecrement,
    disabled = false,
    loading = false,
    compact = false,
}: CartQuantityControlProps) => {
    if (quantity <= 0) {
        return (
            <TouchableOpacity
                onPress={onAdd}
                disabled={disabled}
                className={`bg-[#4CAF50] ${compact ? 'h-9' : 'h-10'} rounded-xl flex-row items-center justify-center ${disabled ? 'opacity-70' : ''}`}
            >
                <Text className={`text-white font-satoshi font-bold ${compact ? 'text-[10px]' : 'text-xs'} mr-2`}>
                    Add to Cart
                </Text>
                <ShoppingCart size={compact ? 12 : 14} color="white" />
            </TouchableOpacity>
        );
    }

    return (
        <View className={`bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl ${compact ? 'h-9 px-2' : 'h-10 px-3'} flex-row items-center justify-between`}>
            <TouchableOpacity
                onPress={onDecrement}
                disabled={disabled}
                className={`w-7 h-7 rounded-full items-center justify-center ${disabled ? 'bg-[#F1F8E9]' : 'bg-white'}`}
            >
                <Ionicons name="remove" size={16} color="#2E7D32" />
            </TouchableOpacity>

            <Text className={`font-satoshi font-bold text-[#2E7D32] ${compact ? 'text-[13px]' : 'text-sm'}`}>
                {quantity}
            </Text>

            <TouchableOpacity
                onPress={onIncrement}
                disabled={disabled}
                className={`w-7 h-7 rounded-full items-center justify-center ${disabled ? 'bg-[#F1F8E9]' : 'bg-white'}`}
            >
                <Ionicons name="add" size={16} color="#2E7D32" />
            </TouchableOpacity>
        </View>
    );
};
