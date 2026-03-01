import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { Plus, X } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setDraftInstructions, RecipeInstruction } from '../../store/slices/recipeSlice';
import Toast from 'react-native-toast-message';

export const CookingStepsScreen = ({ navigation }: any) => {
    const dispatch = useDispatch();
    const draftInstructions = useSelector((state: RootState) => state.recipe.draft.instructions);

    const [steps, setSteps] = useState<RecipeInstruction[]>(
        draftInstructions.length > 0 ? draftInstructions : [{ title: 'Step 1', content: '' }]
    );

    const handleAddStep = () => {
        setSteps([...steps, { title: `Step ${steps.length + 1}`, content: '' }]);
    };

    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const updateStep = (index: number, content: string) => {
        setSteps(steps.map((s, i) => i === index ? { ...s, content } : s));
    };

    const handleNext = () => {
        const hasEmpty = steps.some(s => !s.content.trim());
        if (hasEmpty) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please fill in all steps',
            });
            return;
        }

        dispatch(setDraftInstructions(steps));
        navigation.navigate('VideoPreview');
    };

    return (
        <ScreenWrapper bg="#F7F7F7">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-6 pt-10 pb-4 flex-row items-center justify-between bg-white border-b border-gray-50">
                        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 items-center justify-center bg-gray-100 rounded-full">
                            <Ionicons name="arrow-back" size={20} color="#424242" />
                        </TouchableOpacity>
                        <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Description</Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView
                        className="flex-1 px-6 pt-8"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    >
                        {steps.map((step, index) => (
                            <View key={index} className="mb-6">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="font-satoshi font-bold text-sm text-[#424242]">{step.title}</Text>
                                    {steps.length > 1 && (
                                        <TouchableOpacity onPress={() => handleRemoveStep(index)}>
                                            <X size={16} color="#FF5252" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View className="h-40 bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                                    <TextInput
                                        placeholder={`Input step ${index + 1} instructions...`}
                                        value={step.content}
                                        onChangeText={(text) => updateStep(index, text)}
                                        multiline
                                        className="font-satoshi text-[14px] text-[#424242]"
                                        placeholderTextColor="#BDBDBD"
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleAddStep}
                            className="bg-white border border-[#4CAF50] px-4 py-3 rounded-xl flex-row items-center justify-center mb-20"
                        >
                            <Plus size={18} color="#4CAF50" />
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-sm ml-2">Add Another Step</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View className="px-6 py-6 border-t border-gray-50 bg-white">
                        <TouchableOpacity
                            onPress={handleNext}
                            className="bg-[#4CAF50] h-14 rounded-2xl items-center justify-center"
                        >
                            <Text className="text-white font-satoshi font-bold text-[16px]">View Preview</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};
