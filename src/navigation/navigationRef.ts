import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

type PendingRoute = {
    name: string;
    params?: Record<string, any>;
};

export const navigationRef = createNavigationContainerRef<any>();

const pendingRoutes: PendingRoute[] = [];

export const navigateFromRoot = (name: string, params?: Record<string, any>) => {
    if (navigationRef.isReady()) {
        navigationRef.dispatch(CommonActions.navigate({ name, params }));
        return;
    }
    pendingRoutes.push({ name, params });
};

export const flushPendingNavigation = () => {
    if (!navigationRef.isReady()) return;
    while (pendingRoutes.length > 0) {
        const route = pendingRoutes.shift();
        if (!route) continue;
        navigationRef.dispatch(CommonActions.navigate({ name: route.name, params: route.params }));
    }
};
