import React, { useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text } from 'react-native';
import { Home, Search, ShoppingBag, ShoppingBagIcon, ShoppingCart, User, VideoIcon } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { flushPendingNavigation, navigateFromRoot, navigationRef } from './navigationRef';
import { AppSplashScreen } from '../screens/splash/AppSplashScreen';

import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { VerifyOtpScreen } from '../screens/auth/VerifyOtpScreen';
import { PreferencesScreen } from '../screens/auth/PreferencesScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { ProductDetailScreen } from '../screens/shop/ProductDetailScreen';
import { RecommendedProductsScreen } from '../screens/shop/RecommendedProductsScreen';
import { SavedProductsScreen } from '../screens/shop/SavedProductsScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { OrderDetailScreen } from '../screens/orders/OrderDetailScreen';
import { CheckoutScreen } from '../screens/orders/CheckoutScreen';
import { CardPaymentScreen } from '../screens/orders/CardPaymentScreen';
import { PaymentOtpScreen } from '../screens/orders/PaymentOtpScreen';
import { WalletPaymentScreen } from '../screens/orders/WalletPaymentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RecipesScreen } from '../screens/recipes/RecipesScreen';
import { SavedRecipesScreen } from '../screens/recipes/SavedRecipesScreen';
import { RecipeDetailScreen } from '../screens/recipes/RecipeDetailScreen';
import { RecipeStoryScreen } from '../screens/recipes/RecipeStoryScreen';
import { RecipeOverviewScreen } from '../screens/recipes/RecipeOverviewScreen';
import { RecipeIngredientsScreen } from '../screens/recipes/RecipeIngredientsScreen';
import { RelatedRecipesScreen } from '../screens/recipes/RelatedRecipesScreen';
import { FruitMealRecipesScreen } from '../screens/recipes/FruitMealRecipesScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { SearchResultsScreen } from '../screens/search/SearchResultsScreen';
import { ProfileDetailsScreen } from '../screens/profile/ProfileDetailsScreen';
import { ReferralsScreen } from '../screens/profile/ReferralsScreen';
import { TransactionHistoryScreen } from '../screens/profile/TransactionHistoryScreen';
import { GiftCardsScreen } from '../screens/profile/GiftCardsScreen';
import { WhatsNewScreen } from '../screens/profile/WhatsNewScreen';
import { FaqsScreen } from '../screens/profile/FaqsScreen';
import { SupportScreen } from '../screens/profile/SupportScreen';
import { LegalScreen } from '../screens/profile/LegalScreen';
import { ChefSignupScreen } from '../screens/chef/ChefSignupScreen';
import { ChefProfileScreen } from '../screens/chef/ChefProfileScreen';
import { ManageVideosScreen } from '../screens/chef/ManageVideosScreen';
import { UploadVideoScreen } from '../screens/chef/UploadVideoScreen';
import { InputIngredientsScreen } from '../screens/chef/InputIngredientsScreen';
import { CookingStepsScreen } from '../screens/chef/CookingStepsScreen';
import { VideoPreviewScreen } from '../screens/chef/VideoPreviewScreen';
import { COLORS } from '../constants/colors';
import { cartService } from '../utils/cartService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const TAB_ROUTE_NAMES = ['Home', 'Shop', 'Recipes', 'Orders', 'Profile'];

const getActiveRouteName = (state: any): string => {
    if (!state || !Array.isArray(state.routes) || state.routes.length === 0) {
        return '';
    }

    const currentIndex = typeof state.index === 'number' ? state.index : 0;
    const route = state.routes[currentIndex];

    if (route?.state) {
        return getActiveRouteName(route.state);
    }

    return route?.name || '';
};

const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    height: 85,
                    paddingBottom: 20,
                    paddingTop: 10,
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray[400],
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Shop"
                component={ShopScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ShoppingBagIcon size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Recipes"
                component={RecipesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <VideoIcon size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
};

export const RootNavigator = () => {
    const [activeRouteName, setActiveRouteName] = useState<string>('');

    const isTabRoute = TAB_ROUTE_NAMES.includes(activeRouteName);
    const shouldShowCartFab = activeRouteName.length > 0 && activeRouteName !== 'Orders' && activeRouteName !== 'AppSplash';
    const fabBottom = isTabRoute ? 106 : 28;
    const shouldFetchCartBadge = shouldShowCartFab && !['Onboarding', 'Login', 'Signup', 'VerifyOtp'].includes(activeRouteName);

    const fabStyle = useMemo(() => ({ bottom: fabBottom }), [fabBottom]);

    const { data: cartResponse } = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
        enabled: shouldFetchCartBadge,
        refetchInterval: 20000,
    });

    const cartCount = Number(cartResponse?.data?.item_count || 0);
    const cartCountLabel = cartCount > 99 ? '99+' : String(cartCount);

    return (
        <NavigationContainer
            ref={navigationRef}
            onReady={() => {
                flushPendingNavigation();
                setActiveRouteName(getActiveRouteName(navigationRef.getRootState()));
            }}
            onStateChange={(state) => {
                setActiveRouteName(getActiveRouteName(state));
            }}
        >
            <View style={{ flex: 1 }}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="AppSplash" component={AppSplashScreen} />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
                    <Stack.Screen name="Preferences" component={PreferencesScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Main" component={MainTabNavigator} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} />
                    <Stack.Screen name="OrderDetails" component={OrderDetailScreen} />
                    <Stack.Screen name="CardPayment" component={CardPaymentScreen} />
                    <Stack.Screen name="PaymentOtp" component={PaymentOtpScreen} />
                    <Stack.Screen name="WalletPayment" component={WalletPaymentScreen} />
                    <Stack.Screen name="ChefSignup" component={ChefSignupScreen} />
                    <Stack.Screen name="ChefProfile" component={ChefProfileScreen} />
                    <Stack.Screen name="ManageVideos" component={ManageVideosScreen} />
                    <Stack.Screen name="UploadVideo" component={UploadVideoScreen} />
                    <Stack.Screen name="InputIngredients" component={InputIngredientsScreen} />
                    <Stack.Screen name="CookingSteps" component={CookingStepsScreen} />
                    <Stack.Screen name="VideoPreview" component={VideoPreviewScreen} />
                    <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
                    <Stack.Screen name="Referrals" component={ReferralsScreen} />
                    <Stack.Screen name="GiftCards" component={GiftCardsScreen} />
                    <Stack.Screen name="WhatsNew" component={WhatsNewScreen} />
                    <Stack.Screen name="Faqs" component={FaqsScreen} />
                    <Stack.Screen name="Support" component={SupportScreen} />
                    <Stack.Screen name="Legal" component={LegalScreen} />
                    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                    <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
                    <Stack.Screen name="RecipeStory" component={RecipeStoryScreen} />
                    <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
                    <Stack.Screen name="RecipeOverview" component={RecipeOverviewScreen} />
                    <Stack.Screen name="RecipeIngredients" component={RecipeIngredientsScreen} />
                    <Stack.Screen name="RelatedRecipes" component={RelatedRecipesScreen} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                    <Stack.Screen name="SavedProducts" component={SavedProductsScreen} />
                    <Stack.Screen name="SearchHistory" component={SearchScreen} />
                    <Stack.Screen name="RecommendedProducts" component={RecommendedProductsScreen} />
                    <Stack.Screen name="FruitMealRecipes" component={FruitMealRecipesScreen} />
                    <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
                </Stack.Navigator>

                {shouldShowCartFab ? (
                    <TouchableOpacity
                        onPress={() => navigateFromRoot('Main', { screen: 'Orders' })}
                        activeOpacity={0.85}
                        className="absolute right-5 w-14 h-14 rounded-full bg-[#4CAF50] items-center justify-center shadow-lg"
                        style={fabStyle}
                    >
                        <ShoppingCart size={22} color="#FFFFFF" />
                        {cartCount > 0 ? (
                            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] items-center justify-center border border-white">
                                <Text className="text-white font-satoshi font-bold text-[9px]">
                                    {cartCountLabel}
                                </Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ) : null}
            </View>
        </NavigationContainer>
    );
};
