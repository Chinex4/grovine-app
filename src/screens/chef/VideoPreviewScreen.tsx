import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { recipeService } from '../../utils/recipeService';
import { resetDraft } from '../../store/slices/recipeSlice';
import Toast from 'react-native-toast-message';

export const VideoPreviewScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const draft = useSelector((state: RootState) => state.recipe.draft);
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('title', draft.title);
            formData.append('description', draft.description);

            // Ingredients should be stringified or appended as multiple entries depending on API implementation
            // The API spec usually expects JSON in multipart often as stringified array or multiple parts
            // Assuming stringified array for now as common practice
            formData.append('ingredients', JSON.stringify(draft.ingredients.map(i => ({ id: i.id, quantity: i.quantity }))));
            formData.append('instructions', JSON.stringify(draft.instructions));

            // Mocking file upload for now since we don't have real uris from picker yet
            // In real app: formData.append('video', { uri: draft.video_uri, type: 'video/mp4', name: 'video.mp4' } as any);
            // formData.append('cover_image', { uri: draft.cover_uri, type: 'image/jpeg', name: 'cover.jpg' } as any);

            await recipeService.createRecipe(formData);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Recipe uploaded successfully',
            });

            dispatch(resetDraft());
            navigation.navigate('ChefProfile');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: error.response?.data?.message || error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
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
                        <View className="absolute inset-0 items-center justify-center">
                            <View className="bg-black/20 p-4 rounded-full">
                                <Ionicons name="play" size={32} color="white" />
                            </View>
                        </View>
                    </View>

                    <Text className="text-[20px] font-satoshi font-bold text-[#424242] mb-2">{draft.title}</Text>
                    <Text className="text-[12px] font-satoshi text-[#9E9E9E] leading-[18px] mb-8">
                        {draft.description}
                    </Text>

                    <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Ingredients</Text>
                    <View className="mb-8">
                        {draft.ingredients.map((item, index) => (
                            <Text key={index} className="text-[14px] font-satoshi text-[#424242] mb-2 leading-[20px]">
                                • {item.quantity} {item.name}
                            </Text>
                        ))}
                    </View>

                    <Text className="text-[14px] font-satoshi font-bold text-[#9E9E9E] mb-4">Instruction; How to cook</Text>
                    <View className="mb-20">
                        {draft.instructions.map((step, index) => (
                            <View key={index} className="mb-6">
                                <Text className="text-[14px] font-satoshi font-bold text-[#424242] mb-1">{step.title}</Text>
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
