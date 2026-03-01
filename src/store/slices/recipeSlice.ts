import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecipeIngredient {
    id: string;
    quantity: string;
    name: string;
    product_id?: string;
    item_text?: string;
    is_optional?: boolean;
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
        duration_seconds?: string;
        servings?: string;
        estimated_cost?: string;
        is_quick_recipe?: boolean;
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
        duration_seconds: '',
        servings: '',
        estimated_cost: '',
        is_quick_recipe: false,
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
        setDraftInfo: (state, action: PayloadAction<{
            title?: string;
            description?: string;
            video_uri?: string;
            cover_uri?: string;
            duration_seconds?: string;
            servings?: string;
            estimated_cost?: string;
            is_quick_recipe?: boolean;
        }>) => {
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
