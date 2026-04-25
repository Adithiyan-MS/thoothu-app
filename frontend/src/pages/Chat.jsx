import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { LogOut, User as UserIcon, Send, Search, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Chat() {
    const { authUser, logout } = useAuthStore();
    const { users, getUsers, searchUsers, isUsersLoading, selectedUser, setSelectedUser, messages, getMessages, sendMessage, subscribeToMessages, unsubscribeFromMessages, unreadMessages } = useChatStore();

    const [text, setText] = useState("");
    const messagesEndRef = useRef(null); // Used to auto-scroll to the bottom
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch the sidebar users when the page loads
    useEffect(() => {
        getUsers();
    }, [getUsers]);

    // Automatically fetch chat history whenever you click on a new user in the sidebar
    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser, getMessages]);

    // Smoothly auto-scroll to the bottom every time a new message appears
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Hook up our real-time Socket.IO subscriptions!
    useEffect(() => {
        subscribeToMessages();
        // When the component unmounts (or we switch users), unsubscribe!
        return () => unsubscribeFromMessages();
    }, [selectedUser, subscribeToMessages, unsubscribeFromMessages]);

    // Request Desktop Notification Permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Debounce Search logic
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                searchUsers(searchQuery); // Search for new people!
            } else {
                getUsers(); // If empty, revert back to active conversations
            }
        }, 500); // Wait 500ms after you stop typing

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchUsers, getUsers]);


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim()) return; // Prevent empty messages
        await sendMessage(text);
        setText(""); // Clear the input box
    };

    return (
        <div style={{ height: '100vh', padding: '20px', display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>

            {/* SIDEBAR */}
            <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Chats</h2>
                        <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{authUser.username}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to="/profile" className="btn-primary" style={{ padding: '8px 12px', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                            <Settings size={18} />
                        </Link>
                        <button onClick={logout} className="btn-primary" style={{ padding: '8px 12px', borderRadius: '10px' }}>
                            <LogOut size={18} />
                        </button>
                    </div>

                </div>

                {/* Search Bar */}
                <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium"
                            style={{ paddingLeft: '38px', padding: '10px 10px 10px 38px', fontSize: '0.9rem' }}
                        />
                    </div>
                </div>

                {/* User List Area */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
                    {isUsersLoading ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Loading users...</div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No other users found.</div>
                    ) : (
                        users.map((user) => (
                            <div
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
                                    borderRadius: '16px', cursor: 'pointer', marginBottom: '8px',
                                    background: selectedUser?._id === user._id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: selectedUser?._id === user._id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {user.profilePic ? (
                                        <img src={user.profilePic} alt="profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <UserIcon size={24} color="var(--text-secondary)" />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>{user.username}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {user.isGuest ? "Guest User" : "Member"}
                                    </p>
                                </div>

                                {/* Unread Badge */}
                                {unreadMessages[user._id] > 0 && (
                                    <div style={{
                                        background: 'var(--accent-primary)',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        marginLeft: 'auto', // This magically pushes the badge to the far right side!
                                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                                    }}>
                                        {unreadMessages[user._id]}
                                    </div>
                                )}

                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon size={20} color="var(--text-secondary)" />
                            </div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{selectedUser.username}</h2>
                        </div>

                        {/* Chat Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {messages.map((msg) => (
                                <div key={msg._id} style={{
                                    /* Custom styling depending on who sent the message! */
                                    alignSelf: msg.senderId === authUser._id ? 'flex-end' : 'flex-start',
                                    background: msg.senderId === authUser._id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    borderBottomRightRadius: msg.senderId === authUser._id ? '4px' : '16px',
                                    borderBottomLeftRadius: msg.senderId === authUser._id ? '16px' : '4px',
                                    maxWidth: '70%',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}>
                                    <p style={{ color: 'white', fontSize: '0.95rem' }}>{msg.text}</p>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type a message..."
                                className="input-premium"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <h2 style={{ color: 'white', marginBottom: '10px' }}>Welcome to the Chat</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Select a conversation from the sidebar to start messaging.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
