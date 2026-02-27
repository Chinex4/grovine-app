import { Linking } from 'react-native';

type NavigateFn = (name: string, params?: Record<string, any>) => void;

type RouteTarget = {
    name: string;
    params?: Record<string, any>;
};

const INTERNAL_HOSTS = new Set([
    'grovine.ng',
    'www.grovine.ng',
    'app.grovine.ng',
]);

const normalizePath = (pathname: string) => pathname.replace(/^\/+|\/+$/g, '');
const hasScheme = (value: string) => /^[a-z][a-z0-9+\-.]*:/i.test(value);
const toMainTab = (screen: string, params?: Record<string, any>): RouteTarget => ({
    name: 'Main',
    params: params ? { screen, params } : { screen },
});

const tryParseUrl = (rawUrl: string) => {
    const value = rawUrl.trim();
    if (!value) return null;

    try {
        return new URL(value);
    } catch {
        // continue below with safe fallbacks
    }

    try {
        if (value.startsWith('/')) {
            return new URL(`https://grovine.ng${value}`);
        }
        if (!hasScheme(value)) {
            return new URL(`https://${value}`);
        }
    } catch {
        return null;
    }

    return null;
};

const isInternalUrl = (parsedUrl: URL, rawUrl: string) => {
    const isAppScheme = parsedUrl.protocol === 'grovine:' || parsedUrl.protocol === 'grovineapp:';
    if (isAppScheme) return true;

    if (rawUrl.trim().startsWith('/')) return true;
    return INTERNAL_HOSTS.has(parsedUrl.host.toLowerCase());
};

export const resolveNotificationRoute = (actionUrl: string): RouteTarget | null => {
    const parsed = tryParseUrl(actionUrl);
    if (!parsed) return null;

    try {
        if (!isInternalUrl(parsed, actionUrl)) {
            return null;
        }

        const path = normalizePath(parsed.pathname);
        const segments = path ? path.split('/') : [];
        const first = segments[0]?.toLowerCase();

        if (!first) return toMainTab('Home');
        if (first === 'home') return toMainTab('Home');
        if (first === 'offers') return { name: 'RecommendedProducts' };
        if (first === 'notifications') return { name: 'Notifications' };
        if (first === 'wallet') return { name: 'WalletPayment' };
        if (first === 'referrals') return { name: 'Referrals' };
        if (first === 'gift-cards' || first === 'giftcards') return { name: 'GiftCards' };
        if (first === 'whats-new' || first === 'whatsnew') return { name: 'WhatsNew' };
        if (first === 'faqs' || first === 'faq') return { name: 'Faqs' };
        if (first === 'support') return { name: 'Support' };
        if (first === 'legal') return { name: 'Legal' };

        if (first === 'products' || first === 'product') {
            const productId = segments[1] || parsed.searchParams.get('product_id') || parsed.searchParams.get('id');
            if (productId) return { name: 'ProductDetail', params: { productId } };
            return toMainTab('Shop');
        }

        if (first === 'recipes' || first === 'recipe') {
            const recipeId = segments[1] || parsed.searchParams.get('recipe_id') || parsed.searchParams.get('id');
            if (recipeId) return { name: 'RecipeDetail', params: { recipeId } };
            return toMainTab('Recipes');
        }

        if (first === 'search') {
            const query = parsed.searchParams.get('q') || '';
            if (query) return { name: 'SearchResults', params: { query } };
            return { name: 'SearchHistory' };
        }

        if (first === 'orders') return toMainTab('Orders');
        if (first === 'profile') return toMainTab('Profile');
        if (first === 'shop') return toMainTab('Shop');

        return null;
    } catch {
        return null;
    }
};

const asStringOrNull = (value: unknown) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const extractNotificationActionUrl = (payload: unknown): string | null => {
    if (!payload || typeof payload !== 'object') return null;

    const data = payload as Record<string, any>;
    const directCandidates = [
        data.action_url,
        data.actionUrl,
        data.url,
        data.link,
        data.deep_link,
        data.deeplink,
        data.target_url,
    ];

    for (const candidate of directCandidates) {
        const value = asStringOrNull(candidate);
        if (value) return value;
    }

    if (data.data && typeof data.data === 'object') {
        return extractNotificationActionUrl(data.data);
    }

    return null;
};

export const handleNotificationActionUrl = async (actionUrl: string, navigate: NavigateFn) => {
    const route = resolveNotificationRoute(actionUrl);
    if (route) {
        navigate(route.name, route.params);
        return true;
    }

    try {
        const canOpen = await Linking.canOpenURL(actionUrl);
        if (canOpen) {
            await Linking.openURL(actionUrl);
            return true;
        }
    } catch {
        // no-op
    }
    return false;
};
