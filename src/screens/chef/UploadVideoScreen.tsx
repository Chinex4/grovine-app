import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { UploadCloud } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { resetDraft, setDraftInfo } from '../../store/slices/recipeSlice';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

const fileNameFromUri = (uri?: string) => {
    if (!uri) return '';
    const clean = uri.split('?')[0] || uri;
    const parts = clean.split('/');
    return parts[parts.length - 1] || '';
};

export const UploadVideoScreen = ({ navigation, route }: any) => {
    const dispatch = useDispatch();
    const draft = useSelector((state: RootState) => state.recipe.draft);

    const [title, setTitle] = useState(draft.title || '');
    const [description, setDescription] = useState(draft.description || '');
    const [durationSeconds, setDurationSeconds] = useState(draft.duration_seconds || '');
    const [servings, setServings] = useState(draft.servings || '');
    const [estimatedCost, setEstimatedCost] = useState(draft.estimated_cost || '');
    const [isQuickRecipe, setIsQuickRecipe] = useState(Boolean(draft.is_quick_recipe));

    useEffect(() => {
        if (route?.params?.resetDraft) {
            dispatch(resetDraft());
            setTitle('');
            setDescription('');
            setDurationSeconds('');
            setServings('');
            setEstimatedCost('');
            setIsQuickRecipe(false);
        }
    }, [dispatch, route?.params?.resetDraft]);

    const videoFileName = useMemo(() => fileNameFromUri(draft.video_uri), [draft.video_uri]);
    const coverFileName = useMemo(() => fileNameFromUri(draft.cover_uri), [draft.cover_uri]);

    const requestLibraryPermission = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Toast.show({
                type: 'error',
                text1: 'Permission required',
                text2: 'Please allow photo library access to continue.',
            });
            return false;
        }
        return true;
    };

    const handlePickVideo = async () => {
        const allowed = await requestLibraryPermission();
        if (!allowed) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 1,
        });

        if (result.canceled || !result.assets?.length) return;

        dispatch(setDraftInfo({ video_uri: result.assets[0].uri }));
    };

    const handlePickCover = async () => {
        const allowed = await requestLibraryPermission();
        if (!allowed) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.9,
        });

        if (result.canceled || !result.assets?.length) return;

        dispatch(setDraftInfo({ cover_uri: result.assets[0].uri }));
    };

    const handleNext = () => {
        if (!draft.video_uri) {
            Toast.show({ type: 'error', text1: 'Video is required' });
            return;
        }

        if (!draft.cover_uri) {
            Toast.show({ type: 'error', text1: 'Cover image is required' });
            return;
        }

        if (!title.trim() || !description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Title and description are required.',
            });
            return;
        }

        dispatch(
            setDraftInfo({
                title: title.trim(),
                description: description.trim(),
                duration_seconds: durationSeconds.trim(),
                servings: servings.trim(),
                estimated_cost: estimatedCost.trim(),
                is_quick_recipe: isQuickRecipe,
            })
        );

        navigation.navigate('InputIngredients');
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1">
                    <View className="px-6 pt-10 pb-4 flex-row items-center justify-between border-b border-gray-50">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Upload Video</Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        className="px-6 py-4"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        <TouchableOpacity
                            onPress={handlePickVideo}
                            className="h-14 bg-gray-50 rounded-xl flex-row items-center justify-between px-4 mb-4 border border-gray-100"
                        >
                            <Text className="text-[#9E9E9E] font-satoshi text-[14px]" numberOfLines={1}>
                                {videoFileName || 'Upload Video'}
                            </Text>
                            <Ionicons name="cloud-upload-outline" size={20} color="#9E9E9E" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePickCover}
                            className="h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl items-center justify-center mb-6 overflow-hidden"
                        >
                            {draft.cover_uri ? (
                                <Image source={{ uri: draft.cover_uri }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <>
                                    <UploadCloud size={40} color="#BDBDBD" />
                                    <Text className="text-[#9E9E9E] font-satoshi text-[14px] mt-2">Upload Cover Photo</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {coverFileName ? (
                            <Text className="text-[#9E9E9E] font-satoshi text-[11px] mb-4">{coverFileName}</Text>
                        ) : null}

                        <View className="space-y-4 mb-10">
                            <View className="h-14 bg-gray-50 rounded-xl px-4 justify-center mb-4 border border-gray-100">
                                <TextInput
                                    placeholder="Input Title"
                                    value={title}
                                    onChangeText={setTitle}
                                    className="font-satoshi text-[14px] text-[#424242]"
                                    placeholderTextColor="#9E9E9E"
                                />
                            </View>

                            <View className="bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100 min-h-[120px]">
                                <TextInput
                                    placeholder="Input Description"
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    className="font-satoshi text-[14px] text-[#424242]"
                                    placeholderTextColor="#9E9E9E"
                                    textAlignVertical="top"
                                />
                            </View>

                            <View className="flex-row items-center mb-4">
                                <View className="flex-1 h-14 bg-gray-50 rounded-xl px-4 justify-center border border-gray-100 mr-3">
                                    <TextInput
                                        placeholder="Duration (sec)"
                                        value={durationSeconds}
                                        onChangeText={setDurationSeconds}
                                        keyboardType="number-pad"
                                        className="font-satoshi text-[14px] text-[#424242]"
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                                <View className="flex-1 h-14 bg-gray-50 rounded-xl px-4 justify-center border border-gray-100">
                                    <TextInput
                                        placeholder="Servings"
                                        value={servings}
                                        onChangeText={setServings}
                                        keyboardType="number-pad"
                                        className="font-satoshi text-[14px] text-[#424242]"
                                        placeholderTextColor="#9E9E9E"
                                    />
                                </View>
                            </View>

                            <View className="h-14 bg-gray-50 rounded-xl px-4 justify-center mb-4 border border-gray-100">
                                <TextInput
                                    placeholder="Estimated Cost (optional)"
                                    value={estimatedCost}
                                    onChangeText={setEstimatedCost}
                                    keyboardType="decimal-pad"
                                    className="font-satoshi text-[14px] text-[#424242]"
                                    placeholderTextColor="#9E9E9E"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={() => setIsQuickRecipe((prev) => !prev)}
                                className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 h-12"
                            >
                                <Text className="font-satoshi text-[13px] text-[#424242]">Mark as quick recipe</Text>
                                <Ionicons
                                    name={isQuickRecipe ? 'checkbox' : 'square-outline'}
                                    size={20}
                                    color={isQuickRecipe ? '#4CAF50' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <View className="px-6 py-6 bg-white border-t border-gray-100">
                        <TouchableOpacity onPress={handleNext} className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center">
                            <Text className="text-white font-satoshi font-bold text-[16px]">Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
