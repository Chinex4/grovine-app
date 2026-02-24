import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { UploadCloud } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDraftInfo } from '../../store/slices/recipeSlice';
import Toast from 'react-native-toast-message';

export const UploadVideoScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const draft = useSelector((state: RootState) => state.recipe.draft);

    const [title, setTitle] = useState(draft.title);
    const [description, setDescription] = useState(draft.description);

    const handleNext = () => {
        if (!title.trim() || !description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Title and Description are required',
            });
            return;
        }

        dispatch(setDraftInfo({ title, description }));
        navigation.navigate('InputIngredients');
    };

    return (
        <ScreenWrapper bg="#FFFFFF">
            <View className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                        <Ionicons name="arrow-back" size={20} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Upload Video</Text>
                    <View className="w-8" />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="px-6 py-4">
                    <TouchableOpacity className="h-14 bg-gray-50 rounded-xl flex-row items-center justify-between px-4 mb-6">
                        <Text className="text-[#9E9E9E] font-satoshi text-[14px]">
                            {draft.video_uri ? 'Video Selected' : 'Upload Video'}
                        </Text>
                        <Ionicons name="cloud-upload-outline" size={20} color="#9E9E9E" />
                    </TouchableOpacity>

                    <TouchableOpacity className="h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl items-center justify-center mb-6">
                        <UploadCloud size={40} color="#BDBDBD" />
                        <Text className="text-[#9E9E9E] font-satoshi text-[14px] mt-2">
                            {draft.cover_uri ? 'Cover Selected' : 'Upload Cover Photo'}
                        </Text>
                    </TouchableOpacity>

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
                        <View className="h-32 bg-gray-50 rounded-xl px-4 py-3 mb-4 border border-gray-100">
                            <TextInput
                                placeholder="Input Description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                className="font-satoshi text-[14px] text-left text-[#424242]"
                                placeholderTextColor="#9E9E9E"
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </ScrollView>

                <View className="px-6 py-6 absolute bottom-0 w-full bg-white">
                    <TouchableOpacity
                        onPress={handleNext}
                        className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                    >
                        <Text className="text-white font-satoshi font-bold text-[16px]">Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
};
