import React from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

interface ScreenWrapperProps {
    children: React.ReactNode;
    bg?: string;
    statusBarColor?: string;
    barStyle?: 'light-content' | 'dark-content';
    className?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    bg = 'white',
    statusBarColor = 'white',
    barStyle = 'dark-content',
    className = ''
}) => {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
            <StatusBar barStyle={barStyle} backgroundColor={statusBarColor} />
            <View className={`flex-1 ${className}`}>
                {children}
            </View>
        </SafeAreaView>
    );
};
