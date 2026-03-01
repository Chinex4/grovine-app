import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { recipeService } from '../../utils/recipeService';
import { resetDraft } from '../../store/slices/recipeSlice';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const getMimeTypeFromUri = (uri: string, fallback: string) => {
    const extension = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
    const imageMimes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        heic: 'image/heic',
    };
    const videoMimes: Record<string, string> = {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        m4v: 'video/x-m4v',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo',
    };

    if (fallback.startsWith('image/')) {
        return imageMimes[extension] || fallback;
    }

    return videoMimes[extension] || fallback;
};

const getFileExtension = (uri: string, fallback: string) => {
    const extension = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
    return extension || fallback;
};

export const VideoPreviewScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const draft = useSelector((state: RootState) => state.recipe.draft);
    const [isUploading, setIsUploading] = useState(false);

    const instructionsText = useMemo(() => {
        return draft.instructions
            .map((step, index) => {
                const label = step.title?.trim() || `Step ${index + 1}`;
                return `${label}:\n${step.content.trim()}`;
            })
            .join('\n\n');
    }, [draft.instructions]);

    const handleUpload = async () => {
        if (!draft.video_uri || !draft.cover_uri) {
            Toast.show({
                type: 'error',
                text1: 'Missing files',
                text2: 'Video and cover image are required.',
            });
            return;
        }

        if (!draft.title.trim() || !draft.description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Missing details',
                text2: 'Title and short description are required.',
            });
            return;
        }

        if (draft.ingredients.length === 0 || draft.instructions.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Incomplete recipe',
                text2: 'Add at least one ingredient and one instruction.',
            });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', draft.title.trim());
            formData.append('short_description', draft.description.trim());
            formData.append('instructions', instructionsText);
            formData.append('submit', '1');
            formData.append('is_quick_recipe', draft.is_quick_recipe ? '1' : '0');

            if (draft.duration_seconds?.trim()) {
                formData.append('duration_seconds', draft.duration_seconds.trim());
            }

            if (draft.servings?.trim()) {
                formData.append('servings', draft.servings.trim());
            }

            if (draft.estimated_cost?.trim()) {
                formData.append('estimated_cost', draft.estimated_cost.trim());
            }

            draft.ingredients.forEach((ingredient, index) => {
                const itemText = (ingredient.item_text || ingredient.name || '').trim();
                formData.append(`ingredients[${index}][item_text]`, itemText);

                if (ingredient.product_id) {
                    formData.append(`ingredients[${index}][product_id]`, String(ingredient.product_id));
                }

                const quantity = Number(ingredient.quantity || 1);
                formData.append(`ingredients[${index}][cart_quantity]`, String(quantity > 0 ? quantity : 1));
                formData.append(`ingredients[${index}][is_optional]`, ingredient.is_optional ? '1' : '0');
            });

            const videoExtension = getFileExtension(draft.video_uri, 'mp4');
            const coverExtension = getFileExtension(draft.cover_uri, 'jpg');

            formData.append('video', {
                uri: draft.video_uri,
                type: getMimeTypeFromUri(draft.video_uri, 'video/mp4'),
                name: `recipe-video-${Date.now()}.${videoExtension}`,
            } as any);

            formData.append('cover_image', {
                uri: draft.cover_uri,
                type: getMimeTypeFromUri(draft.cover_uri, 'image/jpeg'),
                name: `recipe-cover-${Date.now()}.${coverExtension}`,
            } as any);

            await recipeService.createRecipe(formData);

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['chef-recipes'] }),
                queryClient.invalidateQueries({ queryKey: ['recipes'] }),
            ]);

            Toast.show({
                type: 'success',
                text1: 'Recipe uploaded',
                text2: 'Your recipe has been submitted for approval.',
            });

            dispatch(resetDraft());
            navigation.navigate('ManageVideos');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Upload failed',
                text2: error?.response?.data?.message || error?.message || 'Could not upload recipe.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Preview</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">Edit</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6 pt-6">
                    <View className="relative mb-6">
                        <Image
                            source={draft.cover_uri ? { uri: draft.cover_uri } : require('../../assets/images/egg_shakshuka.png')}
                            className="w-full h-56 rounded-[24px]"
                            resizeMode="cover"
                        />
                    </View>

                    <Text className="text-[20px] font-satoshi font-bold text-[#424242] mb-2">{draft.title}</Text>
                    <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px] mb-8">{draft.description}</Text>

                    <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Ingredients</Text>
                    <View className="mb-8">
                        {draft.ingredients.map((item, index) => (
                            <Text key={`${item.id}-${index}`} className="text-[14px] font-satoshi text-[#424242] mb-2 leading-[20px]">
                                {item.quantity || '1'} {item.item_text || item.name}
                            </Text>
                        ))}
                    </View>

                    <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Instruction; How to cook</Text>
                    <View className="mb-20">
                        {draft.instructions.map((step, index) => (
                            <View key={`${step.title}-${index}`} className="mb-6">
                                <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-1">{step.title || `Step ${index + 1}`}</Text>
                                <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px]">{step.content}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View className="px-6 py-6 absolute bottom-0 w-full bg-white border-t border-gray-100">
                    <TouchableOpacity
                        onPress={handleUpload}
                        disabled={isUploading}
                        className={`bg-[#4CAF50] h-14 rounded-2xl flex-row items-center justify-center ${isUploading ? 'opacity-70' : ''}`}
                    >
                        {isUploading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text className="text-white font-satoshi font-bold text-[16px] mr-2">Upload</Text>
                                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
