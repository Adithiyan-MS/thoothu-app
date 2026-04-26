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
            // 1. Check if we just arrived with an SSO token in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const ssoToken = urlParams.get('sso_token');

            if (ssoToken) {
                localStorage.setItem("token", ssoToken);
                // Clean up the URL so it looks professional (remove the token from the browser bar)
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // 2. ALWAYS check with the Central Auth Service as the Source of Truth
            // We use the token from localStorage if we have it, or fallback to cookies (withCredentials)
            const centralRes = await axios.get(`${AUTH_URL}/me`, { withCredentials: true });
            
            if (centralRes.data.token) {
                // 2. Central says we are logged in! Save the token
                localStorage.setItem("token", centralRes.data.token);
                
                // 3. Now verify/get profile from our local backend using this token
                // (The interceptor will add the token to the header automatically)
                const localRes = await axios.get(`${BASE_URL}/users/profile`);
                
                const userData = {
                    ...localRes.data,
                    ...centralRes.data.user, // Prefer central data for core identity
                    profilePic: localRes.data.profilePic || centralRes.data.user.avatar
                };
                
                set({ authUser: userData });
                get().connectSocket();
            } else {
                throw new Error("No token from central");
            }
        } catch (error) {
            // If central auth fails, we are logged out everywhere
            set({ authUser: null });
            localStorage.removeItem("token");
            // Also try to clear local cookies just in case
            try { await axios.post(`${BASE_URL}/auth/logout`); } catch(e) {}
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    register: async (username, email, password) => {
        set({ isLoggingIn: true });
        try {
            const res = await axios.post(`${AUTH_URL}/register`, { username, email, password }, { withCredentials: true });
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
            const res = await axios.post(`${AUTH_URL}/verify`, { email, otp }, { withCredentials: true });
            
            // SSO Improvement: Auto-login after verification
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                const userData = {
                    ...res.data.user,
                    profilePic: res.data.user.profilePic || res.data.user.avatar
                };
                set({ authUser: userData });
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
            const res = await axios.post(`${AUTH_URL}/login`, { email, password }, { withCredentials: true });
            
            // Store token for cross-domain auth
            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
            }
            
            const userData = {
                ...res.data.user,
                profilePic: res.data.user.profilePic || res.data.user.avatar
            };
            set({ authUser: userData });
            get().connectSocket();
            toast.success(`Welcome back, ${userData.username}!`);
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
            const res = await axios.post(`${AUTH_URL}/forgotpassword`, { email }, { withCredentials: true });
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
            const res = await axios.put(`${AUTH_URL}/resetpassword`, { email, otp, password: newPassword }, { withCredentials: true });
            toast.success(res.data.message);
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid OTP");
            return false;
        }
    },

    logout: async () => {
        try {
            // 1. Log out from the Central Auth Service (clears central cookies)
            await axios.post(`${AUTH_URL}/logout`, {}, { withCredentials: true });
            
            // 2. Log out from the local backend (clears local cookies)
            await axios.post(`${BASE_URL}/auth/logout`);

            // 3. Clear local storage and state
            localStorage.removeItem("token");
            set({ authUser: null });
            get().disconnectSocket();
            toast.success("Logged out everywhere");
        } catch (error) {
            toast.error("Failed to logout completely");
        }
    }
}));
