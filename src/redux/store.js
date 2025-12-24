import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./auth";
import api from "./api/api";

const store = configureStore({
    reducer: {
        [authSlice.name]: authSlice.reducer,
        [api.reducerPath]: api.reducer,

    },
    middleware: (defaultMiddleware) => [...defaultMiddleware(), api.middleware]
});

export default store;
