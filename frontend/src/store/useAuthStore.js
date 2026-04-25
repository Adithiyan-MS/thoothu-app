import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// CRITICAL: This tells axios to ALWAYS send our secure JWT cookie to the backend!
axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isLoggingIn: false,
    isCheckingAuth: true,
    socket: null, // Holds our Socket connection\
    isChangingPassword: false,


    connectSocket: () => {
        const { authUser, socket } = get();
        // If we are already connected, don't connect again!
        if (!authUser || socket?.connected) return;

        const newSocket = io(import.meta.env.MODE === "development" ? "http://localhost:5000" : "/", {
            query: { userId: authUser._id }
        });

        newSocket.connect();
        set({ socket: newSocket });

        // Bonus: Update Presence when they switch tabs using the Page Visibility API!
        document.addEventListener("visibilitychange", () => {
            if (newSocket.connected) {
                newSocket.emit("updatePresence", { isTabActive: !document.hidden });
            }
        });
    },

    disconnectSocket: () => {
        if (get().socket?.connected) {
            get().socket.disconnect();
        }
        set({ socket: null });
    },

    checkAuth: async () => {
        try {
            const res = await axios.get(`${BASE_URL}/users/profile`);
            set({ authUser: res.data });
            get().connectSocket(); // Connect to real-time chat!
        } catch (error) {
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    register: async (username, email, password) => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${BASE_URL}/auth/register`, { username, email, password });
            toast.success(res.data.message);
            return true; // Return true so the UI knows to redirect to Verify page
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed");
            return false;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    verifyOTP: async (email, otp) => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
            return false;
        } finally {
            set({ isLoggingIn: false });
        }
    },

    login: async (email, password) => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
            set({ authUser: res.data });
            get().connectSocket();
            toast.success(`Welcome back, ${res.data.username}!`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const res = await axios.put(`${BASE_URL}/users/profile`, data);
            // This is the magic! It immediately overwrites our local authUser with the updated one from the database!
            set({ authUser: res.data });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    changePassword: async (data) => {
        set({ isChangingPassword: true });
        try {
            const res = await axios.put(`${BASE_URL}/auth/change-password`, data);
            toast.success(res.data.message);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            set({ isChangingPassword: false });
        }
    },

    guestLogin: async () => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${BASE_URL}/auth/guest-login`);
            set({ authUser: res.data });
            get().connectSocket();
            toast.success("Joined as a Guest!");
        } catch (error) {
            toast.error("Failed to join as guest");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    forgotPassword: async (email) => {
        try {
            const res = await axios.post(`${BASE_URL}/auth/forgot-password`, { email });
            toast.success(res.data.message);
            return true; // Tells the UI it succeeded
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
            return false; // Tells the UI it failed
        }
    },

    resetPassword: async (email, otp, newPassword) => {
        try {
            const res = await axios.post(`${BASE_URL}/auth/reset-password`, { email, otp, newPassword });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP");
            return false;
        }
    },

    logout: async () => {
        try {
            await axios.post(`${BASE_URL}/auth/logout`);
            set({ authUser: null });
            get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to logout");
        }
    }
}));
