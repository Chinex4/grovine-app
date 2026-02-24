import React, { useState, useRef, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, Image, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Button } from '../../components/Button';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Your Food Journey,\nReimagined.',
        description: 'Discover fresh groceries, watch inspiring chef tutorials, and get everything delivered to your doorstep.',
        image: require('../../assets/images/Subheading 4.png'),
    },
    {
        id: '2',
        title: 'Shop for Freshness,\nAnytime.',
        description: 'Browse a wide range of fresh produce, pantry staples, and more all tailored to your needs.',
        image: require('../../assets/images/Subheading 3.png'),
    },
    {
        id: '3',
        title: 'Learn from\nTop Chefs.',
        description: 'Watch easy-to-follow tutorials and order all the ingredients with a single tap.',
        image: require('../../assets/images/Subheading 4.png'),
    },
    {
        id: '4',
        title: 'From Us to\nYour Door.',
        description: 'Enjoy fast, reliable delivery that brings fresh groceries and meal inspirations to you.',
        image: require('../../assets/images/Subheading 5.png'),
    },
    {
        id: '5',
        title: 'Share Your Cart,\nSave More!',
        description: 'Share your cart with friends and family. When they buy, your price drops automatically. A win-win for everyone!',
        image: require('../../assets/images/Subheading 7.png'),
    },
];

export const OnboardingScreen = ({ navigation }: any) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    const nextSlide = () => {
        if (activeIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
            setActiveIndex(activeIndex + 1);
        } else {
            navigation.navigate('Login');
        }
    };

    const getItemLayout = useCallback((_: any, index: number) => ({
        length: width,
        offset: width * index,
        index,
    }), []);

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <FlatList
                    ref={flatListRef}
                    data={SLIDES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    keyExtractor={(item) => item.id}
                    getItemLayout={getItemLayout}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                        <View style={{ width }} className="flex-1 px-8 pt-24 justify-between">
                            <View className="w-full aspect-square items-center justify-center">
                                <Image
                                    source={item.image}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="w-full mb-2">
                                {/* Indicators moved back inside to swipe WITH the title and stay above it */}
                                <View className="flex-row mb-6">
                                    {SLIDES.map((_, index) => (
                                        <View
                                            key={index}
                                            className={`h-2 rounded-full mr-2 ${index === activeIndex ? 'w-10 bg-[#4CAF50]' : 'w-4 bg-[#B2E2B4]'}`}
                                        />
                                    ))}
                                </View>

                                <Text className="text-[28px] font-satoshi font-bold text-[#424242] leading-[36px] mb-3">
                                    {item.title}
                                </Text>
                                <Text className="text-[15px] font-satoshi text-[#9E9E9E] leading-[24px] mb-6">
                                    {item.description}
                                </Text>

                                {/* Placeholder height for the fixed button to maintain spacing */}
                                <View className="h-16 mb-12" />
                            </View>
                        </View>
                    )}
                />

                {/* Fixed Button Footer (Does not swipe) */}
                <View className="absolute bottom-12 left-8 right-8">
                    <Button
                        title="Get Started"
                        onPress={nextSlide}
                        className="bg-[#4CAF50] h-12 rounded-lg"
                        icon={<MaterialIcons name="login" size={20} color="white" />}
                        iconPosition="right"
                    />
                </View>
            </View>
        </ScreenWrapper>
    );
};
