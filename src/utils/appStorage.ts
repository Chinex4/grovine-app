import * as SecureStore from 'expo-secure-store';

type AsyncStorageLike = {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
};

const loadAsyncStorage = (): AsyncStorageLike | null => {
    try {
        // Using Function avoids Metro static module resolution when the package isn't installed.
        const dynamicRequire = Function('moduleName', 'return require(moduleName);') as (moduleName: string) => any;
        const module = dynamicRequire('@react-native-async-storage/async-storage');
        return module?.default || module;
    } catch {
        return null;
    }
};

const asyncStorage = loadAsyncStorage();

export const appStorage = {
    getItem: async (key: string): Promise<string | null> => {
        if (asyncStorage) return asyncStorage.getItem(key);
        return SecureStore.getItemAsync(key);
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (asyncStorage) {
            await asyncStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },

    removeItem: async (key: string): Promise<void> => {
        if (asyncStorage) {
            await asyncStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

