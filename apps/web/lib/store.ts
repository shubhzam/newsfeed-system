import { configureStore } from '@reduxjs/toolkit';
import { healthApi } from './healthApi';
import { authApi } from './authApi';
import { postApi } from './postApi';
import { feedApi } from './feedApi';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    [healthApi.reducerPath]: healthApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [postApi.reducerPath]: postApi.reducer,
    [feedApi.reducerPath]: feedApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      healthApi.middleware,
      authApi.middleware,
      postApi.middleware,
      feedApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;