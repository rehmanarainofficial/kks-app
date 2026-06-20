import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Auth Slice - Manages authentication state
 */
const initialState = {
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      let { user } = action.payload;
      if (user) {
        user = {
          ...user,
          company_user_code: 'KKS',
          company_user_id: user.id || user.company_user_id,
        };
      }
      state.user = user;
      state.company = 'KKS';
      state.isAuthenticated = true;

      // Persist to AsyncStorage
      AsyncStorage.setItem('user', JSON.stringify(user));
      AsyncStorage.setItem('company', 'KKS');
    },
    logout: state => {
      state.user = null;
      state.company = null;
      state.isAuthenticated = false;

      // Clear AsyncStorage
      AsyncStorage.removeItem('user');
      AsyncStorage.removeItem('company');
      
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    restoreSession: (state, action) => {
      let { user } = action.payload;
      if (user) {
        user = {
          ...user,
          company_user_code: 'KKS',
          company_user_id: user.id || user.company_user_id,
        };
        state.user = user;
        state.company = 'KKS';
        state.isAuthenticated = true;
      }
    },
  },
});

export const { setCredentials, logout, setLoading, restoreSession } =
  authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = state => state.auth.user;
export const selectIsAuthenticated = state => state.auth.isAuthenticated;
export const selectAuthLoading = state => state.auth.isLoading;
