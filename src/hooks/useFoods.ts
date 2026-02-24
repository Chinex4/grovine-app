import { useQuery } from '@tanstack/react-query';
import { foodService, FetchFoodsParams } from '../utils/foodService';

export const useFoods = (params: FetchFoodsParams = {}) => {
    return useQuery({
        queryKey: ['foods', params],
        queryFn: () => foodService.fetchFoods(params),
        placeholderData: (previousData) => previousData,
    });
};
