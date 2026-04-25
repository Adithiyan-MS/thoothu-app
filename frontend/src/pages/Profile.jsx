import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { User, Mail, Camera } from 'lucide-react';

export default function Profile() {
    const { authUser, updateProfile, isUpdatingProfile, changePassword, isChangingPassword } = useAuthStore();

    const [username, setUsername] = useState(authUser?.username || "");
    const [bio, setBio] = useState(authUser?.bio || "");
    const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");


    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create a new FileReader to read the image
        const reader = new FileReader();

        // When it finishes reading, save the Base64 string to our state!
        reader.onload = () => {
            const base64Image = reader.result;
            setProfilePic(base64Image);
        };

        // Tell the reader to convert the file into a Base64 Data URL
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateProfile({ username, bio, profilePic });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        await changePassword({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
    };


    return (
        <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Profile Settings</h1>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Profile Picture Upload Area */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <label style={{ cursor: 'pointer', position: 'relative' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '2px solid var(--accent-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={48} color="var(--text-secondary)" />
                                )}
                            </div>

                            {/* The little camera icon badge */}
                            <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--accent-primary)', padding: '8px', borderRadius: '50%' }}>
                                <Camera size={16} color="white" />
                            </div>

                            {/* The secretly hidden file input! */}
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                    </div>

                    {/* Username Input */}
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input type="text" className="input-premium" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>

                    {/* Bio Input */}
                    <div className="form-group">
                        <label className="form-label">Bio</label>
                        <textarea className="input-premium" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." style={{ height: '100px', resize: 'none' }} />
                    </div>

                    <button type="submit" disabled={isUpdatingProfile} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                        {isUpdatingProfile ? "Saving..." : "Save Profile"}
                    </button>
                </form>

                <hr style={{ margin: '32px 0', borderColor: 'var(--glass-border)' }} />

                <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Security Settings</h2>
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-premium" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-premium" required minLength="6" />
                    </div>
                    <button type="submit" disabled={isChangingPassword} className="btn-primary" style={{ padding: '12px', borderRadius: '12px' }}>
                        {isChangingPassword ? "Updating..." : "Update Password"}
                    </button>
                </form>


            </div>
        </div>
    );
}
