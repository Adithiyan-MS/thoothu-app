import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// CRITICAL: This tells axios to ALWAYS send our secure JWT cookie to the backend!
axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";
const AUTH_URL = "https://aranid.onrender.com/api/auth";

// Automatically add token to headers if it exists in localStorage
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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
        set({ isCheckingAuth: true });
        try {
            // 1. Try to check auth with our local backend using the token in localStorage
            // (The axios interceptor handles adding the token)
            const localRes = await axios.get(`${BASE_URL}/users/profile`);
            set({ authUser: localRes.data });
            get().connectSocket();
        } catch (localError) {
            // 2. If local auth fails, try to "Silent Login" using the Central Auth Service
            // This is the SSO magic! It checks if the user has a valid cookie on aranid.onrender.com
            try {
                const centralRes = await axios.get(`${AUTH_URL}/me`, { withCredentials: true });
                if (centralRes.data.token) {
                    localStorage.setItem("token", centralRes.data.token);
                    set({ authUser: centralRes.data.user });
                    get().connectSocket();
                }
            } catch (centralError) {
                // If both fail, the user is definitely not logged in anywhere
                set({ authUser: null });
                localStorage.removeItem("token");
            }
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    register: async (username, email, password) => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${AUTH_URL}/register`, { username, email, password });
            toast.success(res.data.message);
            return true;
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
            const res = await axios.post(`${AUTH_URL}/verify`, { email, otp });
            
            // SSO Improvement: Auto-login after verification
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                set({ authUser: res.data.user });
                get().connectSocket();
            }

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
            const res = await axios.post(`${AUTH_URL}/login`, { email, password });
            
            // Store token for cross-domain auth
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }
            
            set({ authUser: res.data.user });
            get().connectSocket();
            toast.success(`Welcome back, ${res.data.user.username}!`);
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
            // Note: In centralized auth, this might still hit the external service
            // but for now, we'll keep it hitting BASE_URL or AUTH_URL depending on where the user data is.
            // Since we synced databases, hitting BASE_URL works too if it has the logic.
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
            
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }

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
            const res = await axios.post(`${AUTH_URL}/forgotpassword`, { email });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
            return false;
        }
    },

    resetPassword: async (email, otp, newPassword) => {
        try {
            // auth-service uses PUT and /resetpassword and field 'password' instead of 'newPassword'
            const res = await axios.put(`${AUTH_URL}/resetpassword`, { email, otp, password: newPassword });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP");
            return false;
        }
    },

    logout: async () => {
        try {
            await axios.post(`${AUTH_URL}/logout`);
            localStorage.removeItem("token");
            set({ authUser: null });
            get().disconnectSocket();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to logout");
        }
    }
}));
