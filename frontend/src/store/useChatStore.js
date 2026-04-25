import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

axios.defaults.withCredentials = true;
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";

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


        // Listen for Smart Notifications (When in-app but in a different chat)
        socket.on("showInAppNotification", (msg) => {
            const sender = get().users.find((u) => u._id === msg.senderId);
            const senderName = sender ? sender.username : "Someone";

            toast.custom((t) => (
                <div
                    onClick={() => {
                        get().setSelectedUser(sender);
                        toast.dismiss(t.id);
                    }}
                    style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(12px)',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--accent-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.4)',
                        animation: t.visible ? 'fade-in 0.3s ease' : 'fade-out 0.3s ease'
                    }}
                >
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.2rem' }}>💬</span>
                    </div>
                    <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{senderName}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.8 }}>{msg.text.substring(0, 30)}{msg.text.length > 30 ? "..." : ""}</p>
                    </div>
                </div>
            ), { duration: 4000, position: 'top-right' });
        });

        // Listen for Browser Notifications (When tab is minimized/inactive)
        socket.on("showBrowserNotification", (msg) => {
            if (Notification.permission === "granted") {
                const sender = get().users.find((u) => u._id === msg.senderId);
                const senderName = sender ? sender.username : "Someone";

                const notification = new Notification(`Thoothu: ${senderName}`, {
                    body: msg.text,
                    icon: "/logo192.png", // Or a generic message icon
                    tag: msg.senderId, // Prevents notification stacking
                    requireInteraction: false
                });

                notification.onclick = () => {
                    window.focus();
                    if (sender) {
                        get().setSelectedUser(sender);
                    } else {
                        // If users list isn't loaded yet, store it to open after login/load
                        localStorage.setItem("openChatOnLoad", msg.senderId);
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
