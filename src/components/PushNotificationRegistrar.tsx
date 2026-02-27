import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { RootState } from '../store';
import { registerNativePushToken } from '../utils/pushNotificationService';
import { extractNotificationActionUrl, handleNotificationActionUrl } from '../utils/notificationDeepLink';
import { navigateFromRoot } from '../navigation/navigationRef';

export const PushNotificationRegistrar = () => {
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const lastHandledNotificationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!accessToken) {
            return;
        }

        const handleNotificationResponse = async (response: Notifications.NotificationResponse | null) => {
            if (!response) return;

            const notificationId = response.notification.request.identifier;
            if (notificationId && lastHandledNotificationIdRef.current === notificationId) {
                return;
            }
            lastHandledNotificationIdRef.current = notificationId || null;

            const payload = response.notification.request.content.data;
            const actionUrl = extractNotificationActionUrl(payload);
            if (!actionUrl) return;
            await handleNotificationActionUrl(actionUrl, navigateFromRoot);
        };

        const run = async () => {
            try {
                await registerNativePushToken();
            } catch {
                // ignore registration errors silently (e.g. unauthenticated app start)
            }

            try {
                const lastResponse = await Notifications.getLastNotificationResponseAsync();
                await handleNotificationResponse(lastResponse);
                if (lastResponse) {
                    await Notifications.clearLastNotificationResponseAsync();
                }
            } catch {
                // ignore deep-link startup errors
            }
        };

        run();

        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            void handleNotificationResponse(response);
        });

        return () => {
            responseSubscription.remove();
        };
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken) {
            lastHandledNotificationIdRef.current = null;
        }
    }, [accessToken]);

    return null;
};
