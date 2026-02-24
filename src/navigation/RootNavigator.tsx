import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, ShoppingBag, User } from 'lucide-react-native';

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
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { CheckoutScreen } from '../screens/orders/CheckoutScreen';
import { CardPaymentScreen } from '../screens/orders/CardPaymentScreen';
import { PaymentOtpScreen } from '../screens/orders/PaymentOtpScreen';
import { WalletPaymentScreen } from '../screens/orders/WalletPaymentScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RecipesScreen } from '../screens/recipes/RecipesScreen';
import { SavedRecipesScreen } from '../screens/recipes/SavedRecipesScreen';
import { RecipeDetailScreen } from '../screens/recipes/RecipeDetailScreen';
import { RecipeOverviewScreen } from '../screens/recipes/RecipeOverviewScreen';
import { RecipeIngredientsScreen } from '../screens/recipes/RecipeIngredientsScreen';
import { FruitMealRecipesScreen } from '../screens/recipes/FruitMealRecipesScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { SearchResultsScreen } from '../screens/search/SearchResultsScreen';
import { ProfileDetailsScreen } from '../screens/profile/ProfileDetailsScreen';
import { AddressScreen } from '../screens/profile/AddressScreen';
import { ReferralsScreen } from '../screens/profile/ReferralsScreen';
import { TransactionHistoryScreen } from '../screens/profile/TransactionHistoryScreen';
import { ChefSignupScreen } from '../screens/chef/ChefSignupScreen';
import { ChefProfileScreen } from '../screens/chef/ChefProfileScreen';
import { ManageVideosScreen } from '../screens/chef/ManageVideosScreen';
import { UploadVideoScreen } from '../screens/chef/UploadVideoScreen';
import { InputIngredientsScreen } from '../screens/chef/InputIngredientsScreen';
import { CookingStepsScreen } from '../screens/chef/CookingStepsScreen';
import { VideoPreviewScreen } from '../screens/chef/VideoPreviewScreen';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
                    tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Recipes"
                component={RecipesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
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
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
                <Stack.Screen name="Preferences" component={PreferencesScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
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
                <Stack.Screen name="Address" component={AddressScreen} />
                <Stack.Screen name="Referrals" component={ReferralsScreen} />
                <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
                <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
                <Stack.Screen name="RecipeOverview" component={RecipeOverviewScreen} />
                <Stack.Screen name="RecipeIngredients" component={RecipeIngredientsScreen} />
                <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                <Stack.Screen name="SearchHistory" component={SearchScreen} />
                <Stack.Screen name="RecommendedProducts" component={RecommendedProductsScreen} />
                <Stack.Screen name="FruitMealRecipes" component={FruitMealRecipesScreen} />
                <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
