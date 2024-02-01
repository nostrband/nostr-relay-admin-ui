import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "./reducers/UserSlice";
import connectionReducer from "./reducers/ConnectionSlice";
import { getDefaultMiddleware } from "@reduxjs/toolkit";

const customizedMiddleware = getDefaultMiddleware({
  serializableCheck: false,
});

const rootReducer = combineReducers({
  userReducer,
  connectionReducer,
});

export const setupStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: customizedMiddleware,
    devTools: true,
  });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
