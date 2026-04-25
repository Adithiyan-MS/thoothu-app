import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

axios.defaults.withCredentials = true;
const BASE_URL = 'http://localhost:5000/api';

export const useChatStore = create((set, get) => ({
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    messages: [],
    isMessagesLoading: false,
    unreadMessages: {},

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axios.get(`${BASE_URL}/users`);
            set({ users: res.data });
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    searchUsers: async (query) => {
        set({ isUsersLoading: true });
        try {
            const res = await axios.get(`${BASE_URL}/users/search?query=${query}`);
            set({ users: res.data });
        } catch (error) {
            console.error(error); // Optional: log it silently instead of annoying the user with a toast
        } finally {
            set({ isUsersLoading: false });
        }
    },


    setSelectedUser: (selectedUser) => {
        set({ selectedUser });
        // Clear their unread count when we click them!
        if (selectedUser) {
            const currentUnread = get().unreadMessages;
            set({ unreadMessages: { ...currentUnread, [selectedUser._id]: 0 } });
        }
    },


    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axios.get(`${BASE_URL}/messages/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error("Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (text) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axios.post(`${BASE_URL}/messages/send/${selectedUser._id}`, { text });
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message");
        }
    },

    // --- SOCKET.IO REAL-TIME LOGIC ---
    subscribeToMessages: () => {
        const selectedUser = get().selectedUser;
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Tell the backend we are actively looking at THIS chat!
        socket.emit("updatePresence", { activeChatUserId: selectedUser._id });

        // Listen for new messages
        socket.on("newMessage", (newMessage) => {
            const currentSelectedUser = get().selectedUser; // Get the latest selected user

            // If we are looking at them, show the message!
            if (currentSelectedUser && newMessage.senderId === currentSelectedUser._id) {
                set({ messages: [...get().messages, newMessage] });
            } else {
                // If we are NOT looking at them, increase their unread badge!
                const currentUnread = get().unreadMessages;
                const currentCount = currentUnread[newMessage.senderId] || 0;

                set({
                    unreadMessages: {
                        ...currentUnread,
                        [newMessage.senderId]: currentCount + 1
                    }
                });
            }
        });


        // Listen for Smart Notifications
        socket.on("showInAppNotification", (msg) => {
            toast('New Message Received!', { icon: '💬' });
        });

        socket.on("showBrowserNotification", (msg) => {
            if (Notification.permission === "granted") {
                // 1. Find the sender's name from our users list
                const sender = get().users.find((u) => u._id === msg.senderId);
                const senderName = sender ? sender.username : "Someone";

                // 2. Create the notification with their name
                const notification = new Notification(`New message from ${senderName}`, {
                    body: msg.text
                });

                // 3. Make it clickable!
                notification.onclick = () => {
                    window.focus(); // Brings the browser tab to the front
                    if (sender) {
                        get().setSelectedUser(sender); // Automatically opens their chat!
                    }
                };
            }
        });

    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // Tell backend we left the chat
        socket.emit("updatePresence", { activeChatUserId: null });

        socket.off("newMessage");
        socket.off("showInAppNotification");
        socket.off("showBrowserNotification");
    }
}));
