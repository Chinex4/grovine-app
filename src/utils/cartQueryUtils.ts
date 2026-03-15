import { CartItem, CartResponse } from './cartService';

const TEMP_CART_ITEM_PREFIX = 'temp-cart-item-';

const toFiniteNumber = (value: number | string | null | undefined) => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
};

const getUnitPrice = (item: CartItem) =>
    toFiniteNumber(item.unit_price ?? item.product?.price ?? item.food?.price ?? 0);

const getUnitDiscount = (item: CartItem) =>
    toFiniteNumber(item.unit_discount ?? item.product?.discount ?? item.food?.discount ?? 0);

const withCalculatedTotals = (item: CartItem): CartItem => {
    const quantity = Math.max(0, toFiniteNumber(item.quantity));
    const unitPrice = getUnitPrice(item);
    const unitDiscount = getUnitDiscount(item);
    const effectiveUnitPrice = Math.max(unitPrice - unitDiscount, 0);

    return {
        ...item,
        quantity,
        unit_price: unitPrice,
        unit_discount: unitDiscount,
        line_total: effectiveUnitPrice * quantity,
    };
};

const buildCartResponse = (items: CartItem[]): CartResponse => {
    const normalizedItems = items
        .map(withCalculatedTotals)
        .filter((item) => item.quantity > 0);

    const subtotal = normalizedItems.reduce(
        (sum, item) => sum + getUnitPrice(item) * item.quantity,
        0
    );
    const totalDiscount = normalizedItems.reduce(
        (sum, item) => sum + getUnitDiscount(item) * item.quantity,
        0
    );

    return {
        data: {
            items: normalizedItems,
            item_count: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
            subtotal,
            total_discount: totalDiscount,
            total: Math.max(subtotal - totalDiscount, 0),
        },
    };
};

export const createEmptyCartResponse = (): CartResponse => buildCartResponse([]);

export const getProductIdFromCartItem = (item: CartItem) =>
    String(item.product_id || item.product?.id || item.food_id || item.food?.id || '');

export const applyProductQuantityToCart = (
    cart: CartResponse | undefined,
    {
        productId,
        quantity,
    }: {
        productId: string;
        quantity: number;
    }
): CartResponse => {
    const normalizedProductId = String(productId || '');
    if (!normalizedProductId) return cart || createEmptyCartResponse();

    const nextQuantity = Math.max(0, toFiniteNumber(quantity));
    const existingItems = [...(cart?.data?.items || [])];
    const existingIndex = existingItems.findIndex(
        (item) => getProductIdFromCartItem(item) === normalizedProductId
    );

    if (existingIndex >= 0) {
        if (nextQuantity <= 0) {
            existingItems.splice(existingIndex, 1);
        } else {
            existingItems[existingIndex] = withCalculatedTotals({
                ...existingItems[existingIndex],
                quantity: nextQuantity,
            });
        }
        return buildCartResponse(existingItems);
    }

    if (nextQuantity <= 0) {
        return buildCartResponse(existingItems);
    }

    existingItems.push(
        withCalculatedTotals({
            id: `${TEMP_CART_ITEM_PREFIX}${normalizedProductId}`,
            food_id: normalizedProductId,
            product_id: normalizedProductId,
            quantity: nextQuantity,
        })
    );

    return buildCartResponse(existingItems);
};
