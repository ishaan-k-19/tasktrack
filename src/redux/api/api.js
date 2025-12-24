
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { server } from '../../constants/config';

const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: `${server}/api/v1/`,
        credentials: 'include',
    }),
    tagTypes: ["Todos", "User", "Notes"],
    endpoints: (builder) => ({
        loadUser: builder.query({
            query: () => ({
                url: 'me',
            }),
            providesTags: ['User'],
        }),
        
        addTask: builder.mutation({
            query: ({ title, description }) => ({
                url: 'newtask',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { title, description },
            }),
            invalidatesTags: ['Todos'],
        }),
        updateTask: builder.mutation({
            query: (taskId) => ({
                url: `task/${taskId}`,
                method: 'GET',
            }),
            invalidatesTags: ['Todos'],
        }),
        deleteTask: builder.mutation({
            query: (taskId) => ({
                url: `task/${taskId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Todos'],
        }),
        loadNotes: builder.query({
            query: () => ({
                url: 'fetchall',
            }),
            providesTags: ['Notes'],
        }),
        addNote: builder.mutation({
            query: ({ title, description, canvasState }) => ({
                url: 'createnote',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { title, description, canvasState },
            }),
            invalidatesTags: ['Notes'],
        }),
        updateNote: builder.mutation({
            query: ({ noteId, title, description, canvasState }) => {
                return {
                    url: `updatenote/${noteId}`,
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: { title, description, canvasState },
                };
            },
            invalidatesTags: ['Notes'],
        }),
        
        deleteNote: builder.mutation({
            query: (noteId) => ({
                url: `deletenote/${noteId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notes'],
        }),
        updateProfile: builder.mutation({
            query: (formData) => ({
                url: 'updateprofile',
                method: 'PUT',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            }),
            invalidatesTags: ['User'],
        }),
        logout: builder.query({
            query: () => ({
                url: 'logout',
                method: 'GET',
            }),
            invalidatesTags: ['User'],
        }),
        register: builder.mutation({
            query: (formData) => ({
                url: 'register',
                method: 'POST',
                headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
            }),
            invalidatesTags: ['User'],
        }),
        updatePassword: builder.mutation({
            query: ({ oldPassword, newPassword }) => ({
                url: 'updatePassword',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: { oldPassword, newPassword },
            }),
            invalidatesTags: ['User'],
        }),
        verify: builder.mutation({
            query: (otp) => ({
                url: 'verify',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: { otp },
            }),
            invalidatesTags: ['User'],
        }),
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: 'forgetpassword',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: { email },
            }),
            invalidatesTags: ['User'],
        }),
        resetPassword: builder.mutation({
            query: ({ otp, newPassword }) => ({
                url: 'resetPassword',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: { otp, newPassword },
            }),
            invalidatesTags: ['User'],
        }),
    }),
});

export default api;

export const { 
    useLoadUserQuery,
    useAddTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useUpdateProfileMutation,
    useLogoutQuery,
    useRegisterMutation,
    useUpdatePasswordMutation,
    useVerifyMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useLoadNotesQuery,
    useAddNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = api;
