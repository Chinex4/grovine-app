import Constants from 'expo-constants';

type PlayStoreReviewExtra = {
    enabled?: boolean | string;
    reviewerEmail?: string;
    reviewerName?: string;
    reviewerOtp?: string;
};

const reviewExtra = (Constants.expoConfig?.extra?.playStoreReview || {}) as PlayStoreReviewExtra;

const normalizeBoolean = (value: PlayStoreReviewExtra['enabled']) => {
    if (typeof value === 'boolean') {
        return value;
    }

    return String(value || '').toLowerCase() === 'true';
};

export const PLAY_STORE_REVIEW_CONFIG = {
    enabled: normalizeBoolean(reviewExtra.enabled),
    reviewerEmail: reviewExtra.reviewerEmail || '',
    reviewerName: reviewExtra.reviewerName || 'Play Store Reviewer',
    reviewerOtp: reviewExtra.reviewerOtp || '',
};

export const isPlayStoreReviewBuild =
    PLAY_STORE_REVIEW_CONFIG.enabled &&
    Boolean(PLAY_STORE_REVIEW_CONFIG.reviewerEmail) &&
    Boolean(PLAY_STORE_REVIEW_CONFIG.reviewerOtp);
