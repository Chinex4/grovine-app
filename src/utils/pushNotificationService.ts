import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { notificationService } from './notificationService';

const TOKEN_STORAGE_KEY = 'native_push_device_token';

let handlerRegistered = false;

const ensureNotificationHandler = () => {
    if (handlerRegistered) return;
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
    handlerRegistered = true;
};

export const registerNativePushToken = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return null;
    }

    ensureNotificationHandler();

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    const permissions = await Notifications.getPermissionsAsync();
    let finalStatus = permissions.status;
    if (finalStatus !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        finalStatus = request.status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    const nativeToken = await Notifications.getDevicePushTokenAsync();
    const token = typeof nativeToken.data === 'string' ? nativeToken.data : String(nativeToken.data || '');
    if (!token) {
        return null;
    }

    const lastRegisteredToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
    if (lastRegisteredToken === token) {
        return token;
    }

    await notificationService.registerDeviceToken({
        platform: Platform.OS,
        token,
        device_name: `${Platform.OS}-device`,
    });

    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    return token;
};
