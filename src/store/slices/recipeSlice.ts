import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecipeIngredient {
    id: string;
    quantity: string;
    name: string;
}

export interface RecipeInstruction {
    title: string;
    content: string;
}

interface RecipeState {
    draft: {
        title: string;
        description: string;
        video_uri?: string;
        cover_uri?: string;
        ingredients: RecipeIngredient[];
        instructions: RecipeInstruction[];
    };
    isUploading: boolean;
    error: string | null;
}

const initialState: RecipeState = {
    draft: {
        title: '',
        description: '',
        ingredients: [],
        instructions: [],
    },
    isUploading: false,
    error: null,
};

const recipeSlice = createSlice({
    name: 'recipe',
    initialState,
    reducers: {
        setDraftInfo: (state, action: PayloadAction<{ title: string; description: string; video_uri?: string; cover_uri?: string }>) => {
            state.draft = { ...state.draft, ...action.payload };
        },
        setDraftIngredients: (state, action: PayloadAction<RecipeIngredient[]>) => {
            state.draft.ingredients = action.payload;
        },
        setDraftInstructions: (state, action: PayloadAction<RecipeInstruction[]>) => {
            state.draft.instructions = action.payload;
        },
        resetDraft: (state) => {
            state.draft = initialState.draft;
            state.error = null;
        },
        setUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const {
    setDraftInfo,
    setDraftIngredients,
    setDraftInstructions,
    resetDraft,
    setUploading,
    setError
} = recipeSlice.actions;

export default recipeSlice.reducer;
