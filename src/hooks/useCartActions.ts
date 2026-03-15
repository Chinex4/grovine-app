import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { CartResponse, cartService } from '../utils/cartService';
import {
    applyProductQuantityToCart,
    createEmptyCartResponse,
    getProductIdFromCartItem,
} from '../utils/cartQueryUtils';

export const useCartActions = () => {
    const queryClient = useQueryClient();
    const [pendingProductIds, setPendingProductIds] = useState<Record<string, boolean>>({});
    const desiredQuantitiesRef = useRef<Record<string, number>>({});
    const syncingProductIdsRef = useRef<Record<string, boolean>>({});
    const confirmedCartRef = useRef<CartResponse | undefined>(
        (queryClient.getQueryData(['cart']) as CartResponse | undefined) || undefined
    );

    const cartQuery = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
    });

    useEffect(() => {
        if (cartQuery.data && Object.keys(pendingProductIds).length === 0) {
            confirmedCartRef.current = cartQuery.data;
        }
    }, [cartQuery.data, pendingProductIds]);

    if (!confirmedCartRef.current && cartQuery.data) {
        confirmedCartRef.current = cartQuery.data;
    }

    const items = cartQuery.data?.data?.items || [];
    const cart = cartQuery.data?.data || createEmptyCartResponse().data;

    const cartItemByProductId = useMemo(() => {
        const map = new Map<string, (typeof items)[number]>();
        items.forEach((item) => {
            const productId = getProductIdFromCartItem(item);
            if (!productId) return;
            map.set(productId, item);
        });
        return map;
    }, [items]);

    const setPendingState = (productId: string, isPending: boolean) => {
        setPendingProductIds((prev) => {
            if (isPending) {
                return { ...prev, [productId]: true };
            }

            if (!prev[productId]) {
                return prev;
            }

            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const syncProductQuantity = async (productId: string) => {
        if (!productId || syncingProductIdsRef.current[productId]) return;

        syncingProductIdsRef.current[productId] = true;
        setPendingState(productId, true);

        try {
            while (true) {
                const desiredQuantity = Math.max(0, Number(desiredQuantitiesRef.current[productId] || 0));
                const confirmedItems = confirmedCartRef.current?.data?.items || [];
                const confirmedItem = confirmedItems.find(
                    (item) => getProductIdFromCartItem(item) === productId
                );
                const confirmedQuantity = confirmedItem?.quantity || 0;

                if (desiredQuantity === confirmedQuantity) {
                    break;
                }

                if (!confirmedItem) {
                    if (desiredQuantity <= 0) break;
                    await cartService.addCartItem(productId, desiredQuantity);
                } else {
                    await cartService.updateCart(confirmedItem.id, desiredQuantity);
                }

                const refreshedCart = await queryClient.fetchQuery({
                    queryKey: ['cart'],
                    queryFn: cartService.getCart,
                });

                confirmedCartRef.current = refreshedCart;

                const latestDesiredQuantity = Math.max(
                    0,
                    Number(desiredQuantitiesRef.current[productId] || 0)
                );
                const latestConfirmedItem = refreshedCart.data.items.find(
                    (item) => getProductIdFromCartItem(item) === productId
                );
                const latestConfirmedQuantity = latestConfirmedItem?.quantity || 0;

                if (latestDesiredQuantity === latestConfirmedQuantity) {
                    break;
                }

                queryClient.setQueryData(['cart'], (current: CartResponse | undefined) =>
                    applyProductQuantityToCart(current, {
                        productId,
                        quantity: latestDesiredQuantity,
                    })
                );
            }
        } catch (error: any) {
            try {
                const refreshedCart = await queryClient.fetchQuery({
                    queryKey: ['cart'],
                    queryFn: cartService.getCart,
                });
                confirmedCartRef.current = refreshedCart;
            } catch {
                queryClient.setQueryData(['cart'], confirmedCartRef.current || createEmptyCartResponse());
            }

            const rollbackQuantity =
                confirmedCartRef.current?.data?.items.find(
                    (item) => getProductIdFromCartItem(item) === productId
                )?.quantity || 0;
            desiredQuantitiesRef.current[productId] = rollbackQuantity;

            Toast.show({
                type: 'error',
                text1: 'Could not update cart',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        } finally {
            syncingProductIdsRef.current[productId] = false;
            setPendingState(productId, false);
        }
    };

    const setProductQuantity = async (productId: string, quantity: number) => {
        const normalizedProductId = String(productId || '');
        if (!normalizedProductId) return;

        const nextQuantity = Math.max(0, Number(quantity || 0));
        desiredQuantitiesRef.current[normalizedProductId] = nextQuantity;
        setPendingState(normalizedProductId, true);

        queryClient.setQueryData(['cart'], (current: CartResponse | undefined) =>
            applyProductQuantityToCart(current, {
                productId: normalizedProductId,
                quantity: nextQuantity,
            })
        );

        void syncProductQuantity(normalizedProductId);
    };

    const incrementProduct = async (productId: string) => {
        const currentQty = cartItemByProductId.get(productId)?.quantity || 0;
        await setProductQuantity(productId, currentQty + 1);
    };

    const decrementProduct = async (productId: string) => {
        const currentQty = cartItemByProductId.get(productId)?.quantity || 0;
        const nextQty = Math.max(0, currentQty - 1);
        await setProductQuantity(productId, nextQty);
    };

    const getProductQuantity = (productId: string) => cartItemByProductId.get(productId)?.quantity || 0;

    const isProductPending = (productId: string) => Boolean(pendingProductIds[productId]);

    return {
        cart,
        cartQuery,
        items,
        getProductQuantity,
        setProductQuantity,
        incrementProduct,
        decrementProduct,
        isProductPending,
        hasPendingCartSync: Object.keys(pendingProductIds).length > 0,
    };
};
