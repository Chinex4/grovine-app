export type RootStackParamList = {
    Onboarding: undefined;
    Auth: undefined;
    Main: undefined;
};

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    VerifyOtp: { email: string; type: 'signup' | 'login' };
    Preferences: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Search: undefined;
    Orders: undefined;
    Profile: undefined;
};

export type HomeStackParamList = {
    HomeScreen: undefined;
    ProductDetails: { productId: string };
    Notifications: undefined;
};
