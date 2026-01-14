import React from 'react';
import { XCircle, Shield, User, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';

interface ManageAdminsModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: any[]; // Using any for now to match App.tsx structure, ideally UserProfile
    currentUserEmail: string | null;
}

const ManageAdminsModal: React.FC<ManageAdminsModalProps> = ({ isOpen, onClose, users, currentUserEmail }) => {
    if (!isOpen) return null;

    const handleToggleRole = async (email: string, currentRole: UserRole) => {
        const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await updateDoc(doc(db, 'users', email), {
                role: newRole
            });
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role");
        }
    };

    // Filter out the current super admin from the list to prevent self-demotion or accidents
    const displayUsers = users.filter(u => u.email !== currentUserEmail);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#673ab7]" />
                        Manage Admins
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <p className="text-sm text-blue-800">
                        You are the <strong>Super Admin</strong>. You can promote trusted users to <strong>Admin</strong> status.
                        Admins can approve/reject leave requests but cannot manage other admins.
                    </p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {displayUsers.map((u) => {
                        const isSuperAdmin = u.role === 'super_admin'; // Should technically not be in this list per filter above, but safety check
                        const isAdmin = u.role === 'admin';

                        return (
                            <div key={u.email} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border-b last:border-0 border-gray-50">
                                <div className="flex items-center gap-3">
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full border border-gray-100" alt="avatar" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                            {u.displayName}
                                            {isAdmin && <Shield className="w-3 h-3 text-blue-600 fill-current" />}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">{u.email}</p>
                                    </div>
                                </div>

                                {!isSuperAdmin && (
                                    <button
                                        onClick={() => handleToggleRole(u.email, u.role || 'user')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isAdmin
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                            }`}
                                    >
                                        {isAdmin ? 'Demote to User' : 'Promote to Admin'}
                                    </button>
                                )}
                            </div>
                        )
                    })}

                    {displayUsers.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No other registered users found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageAdminsModal;