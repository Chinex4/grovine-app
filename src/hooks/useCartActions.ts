import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { CartItem, cartService } from '../utils/cartService';

const getProductIdFromCartItem = (item: CartItem) =>
    String(item.product_id || item.product?.id || item.food_id || '');

export const useCartActions = () => {
    const queryClient = useQueryClient();
    const [pendingProductId, setPendingProductId] = useState<string | null>(null);

    const cartQuery = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
    });

    const items = cartQuery.data?.data?.items || [];

    const cartItemByProductId = useMemo(() => {
        const map = new Map<string, CartItem>();
        items.forEach((item) => {
            const productId = getProductIdFromCartItem(item);
            if (!productId) return;
            map.set(productId, item);
        });
        return map;
    }, [items]);

    const invalidateCart = async () => {
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
    };

    const addMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            cartService.addCartItem(productId, quantity),
        onSuccess: invalidateCart,
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Could not add to cart',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
            cartService.updateCart(cartItemId, quantity),
        onSuccess: invalidateCart,
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Could not update cart',
                text2: error?.response?.data?.message || error?.message || 'Please try again.',
            });
        },
    });

    const setProductQuantity = async (productId: string, quantity: number) => {
        const normalizedProductId = String(productId || '');
        if (!normalizedProductId) return;

        const currentItem = cartItemByProductId.get(normalizedProductId);

        setPendingProductId(normalizedProductId);
        try {
            if (!currentItem) {
                if (quantity <= 0) return;
                await addMutation.mutateAsync({ productId: normalizedProductId, quantity });
                return;
            }
            await updateMutation.mutateAsync({ cartItemId: currentItem.id, quantity });
        } finally {
            setPendingProductId((prev) => (prev === normalizedProductId ? null : prev));
        }
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

    const isProductPending = (productId: string) =>
        pendingProductId === productId && (addMutation.isPending || updateMutation.isPending);

    return {
        cartQuery,
        items,
        getProductQuantity,
        setProductQuantity,
        incrementProduct,
        decrementProduct,
        isProductPending,
        pendingProductId,
    };
};

