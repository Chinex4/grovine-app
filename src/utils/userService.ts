import api from './api';
import * as FileSystem from 'expo-file-system/legacy';

export interface UserProfile {
    id: string;
    name: string;
    role?: string;
    username?: string;
    phone?: string;
    email: string;
    date_of_birth?: string;
    address?: string;
    profile_picture?: {
        url: string;
        public_id?: string;
    } | null;
    chef?: Record<string, any> | null;
    [key: string]: any;
}

export interface UpdateProfilePayload {
    name?: string;
    username?: string;
    phone?: string;
    email?: string;
    date_of_birth?: string;
    address?: string;
}

const resolveProfilePicture = (payload: any) => {
    const profilePicture = payload?.profile_picture;

    if (typeof profilePicture === 'string') {
        const url = profilePicture.trim();
        if (url && url !== 'null' && url !== 'undefined') {
            return { url, public_id: undefined };
        }
    }

    const candidateUrl =
        profilePicture?.url ||
        payload?.profile_picture_url ||
        payload?.avatar_url ||
        payload?.avatar;

    if (typeof candidateUrl === 'string') {
        const url = candidateUrl.trim();
        if (url && url !== 'null' && url !== 'undefined') {
            return {
                url,
                public_id: profilePicture?.public_id || payload?.profile_picture_public_id,
            };
        }
    }

    return null;
};

const normalizeUser = (payload: any): UserProfile => ({
    ...payload,
    id: String(payload?.id ?? payload?.user_id ?? ''),
    name: payload?.name ?? '',
    role: payload?.role ? String(payload.role) : '',
    username: payload?.username ?? '',
    phone: payload?.phone ?? '',
    email: payload?.email ?? '',
    date_of_birth: payload?.date_of_birth ?? '',
    address: payload?.address ?? '',
    profile_picture: resolveProfilePicture(payload),
});

const createUploadFileFromUri = async (uri: string) => {
    if (!uri) {
        throw new Error('Image URI is required');
    }

    let localUri = uri.trim();
    if (/^https?:\/\//i.test(localUri)) {
        const extension = localUri.split('?')[0].split('.').pop() || 'jpg';
        const tempPath = `${FileSystem.cacheDirectory}profile-${Date.now()}.${extension}`;
        await FileSystem.downloadAsync(localUri, tempPath);
        localUri = tempPath;
    }

    const extension = localUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        heic: 'image/heic',
    };

    return {
        uri: localUri,
        type: mimeMap[extension] || 'image/jpeg',
        name: `profile-${Date.now()}.${extension}`,
    } as any;
};

export const userService = {
    getMe: async (): Promise<{ data: UserProfile }> => {
        const response = await api.get('/user/me');
        return {
            data: normalizeUser(response.data?.data || response.data),
        };
    },

    updateProfile: async (payload: UpdateProfilePayload): Promise<{ data: UserProfile }> => {
        const response = await api.patch('/user/me', payload);
        return {
            data: normalizeUser(response.data?.data || response.data),
        };
    },

    uploadProfilePicture: async (profilePicture: any): Promise<any> => {
        const formData = new FormData();
        formData.append('profile_picture', profilePicture);
        const response = await api.post('/user/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    uploadProfilePictureFromUri: async (uri: string) => {
        const uploadFile = await createUploadFileFromUri(uri);
        return userService.uploadProfilePicture(uploadFile);
    },

    deleteAccount: async () => {
        const response = await api.delete('/user/me');
        return response.data;
    },
};
