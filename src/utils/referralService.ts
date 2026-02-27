import api from './api';

export interface ReferralRewardRules {
    referrer_first_order_reward: string;
    referrer_second_order_reward: string;
    referred_first_order_reward: string;
}

export interface ReferralStats {
    total_referrals: number;
    first_order_conversions: number;
    second_order_conversions: number;
    pending_referrals: number;
    total_referrer_bonus_earned: string;
}

export interface ReferredUser {
    id?: string;
    name?: string;
    email?: string;
    [key: string]: any;
}

export interface ReferralData {
    referral_code: string;
    currency: string;
    reward_rules: ReferralRewardRules;
    stats: ReferralStats;
    referred_users: ReferredUser[];
}

export interface ReferralResponse {
    message: string;
    data: ReferralData;
}

export const referralService = {
    getReferrals: async (): Promise<ReferralResponse> => {
        const response = await api.get('/referrals');
        const payload = response.data || {};
        const data = payload.data || {};

        return {
            message: payload.message || 'Referral details fetched successfully.',
            data: {
                referral_code: data.referral_code || '',
                currency: data.currency || 'NGN',
                reward_rules: {
                    referrer_first_order_reward: data.reward_rules?.referrer_first_order_reward ?? '0.00',
                    referrer_second_order_reward: data.reward_rules?.referrer_second_order_reward ?? '0.00',
                    referred_first_order_reward: data.reward_rules?.referred_first_order_reward ?? '0.00',
                },
                stats: {
                    total_referrals: Number(data.stats?.total_referrals ?? 0),
                    first_order_conversions: Number(data.stats?.first_order_conversions ?? 0),
                    second_order_conversions: Number(data.stats?.second_order_conversions ?? 0),
                    pending_referrals: Number(data.stats?.pending_referrals ?? 0),
                    total_referrer_bonus_earned: data.stats?.total_referrer_bonus_earned ?? '0.00',
                },
                referred_users: Array.isArray(data.referred_users) ? data.referred_users : [],
            },
        };
    },
};
