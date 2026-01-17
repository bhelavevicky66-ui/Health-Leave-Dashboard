import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  FileText,
  Target,
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  FilterX,
  CalendarDays,
  History,
  Sun,
  AlertCircle,
  LogOut,
  ShieldAlert,
  ChevronDown,
  Building,
  Calendar,
  Mail,
  Clock,
  XCircle,
  Hash,
  Eye,
  EyeOff,
  Shield,
  Trash2,
  Info
} from 'lucide-react';
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { Submission, DashboardStats, SubmissionStatus, UserRole } from './types';
import DashboardCard from './components/DashboardCard';
import SubmissionsTable from './components/SubmissionsTable';
import SubmissionForm from './components/SubmissionForm';
import ApprovedTimeline from './components/ApprovedTimeline';
import WeeklyHoursList from './components/WeeklyHoursList';
import ManageAdminsModal from './components/ManageAdminsModal';

const DISCORD_WEBHOOK_URL = "/api/discord/1423267890227839009/Fa0y_SNlNX7d_gaHnUvoChs3N21DbApEF7MigvF2Nq_hJhA2icbsTWz4LcoXxpGDQyPb";
const DISCORD_MENTION_ID = "1385109379845591062";
// const ALLOWED_DOMAIN = "@gmail.com"; // Removed restriction
const SUPER_ADMIN_EMAIL = "bhelavevicky66@gmail.com";

const getTodayString = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const parseDurationToHours = (duration: string | undefined): number => {
  if (!duration) return 0;
  const d = duration.toLowerCase();
  if (d.includes('1 day')) return 9; // User specified 9 hours
  if (d.includes('first half')) return 4; // User specified 4 hours
  if (d.includes('second half')) return 3; // User specified 3 hours
  if (d.includes('half')) return 3; // Fallback for generic 'half' if needed, though specific halves are covered
  if (d.includes('2 hours')) return 2;
  if (d.includes('4 hours')) return 4;
  if (d.includes('1 hour')) return 1;

  // Try parsing "X hours"
  const match = d.match(/(\d+)\s*hour/);
  if (match) return parseInt(match[1], 10);

  return 0;
};

const INITIAL_DATA: Submission[] = [];

type View = 'dashboard' | 'form' | 'submissions';
type StatusFilter = 'all' | SubmissionStatus;
type SubFilter = 'total' | 'today' | 'weekly' | 'weeklyHours';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_DATA);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [discordIdInput, setDiscordIdInput] = useState('');
  const [houseInput, setHouseInput] = useState('');
  const [showDiscordId, setShowDiscordId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subFilter, setSubFilter] = useState<SubFilter>('total');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [discordStatus, setDiscordStatus] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalApproved: 0,
    totalRejected: 0,
    pending: 0,
    approved: 0,
    campusTotal: 37,
    todayApproved: 0,
    weeklyApproved: 0,
    fullDayApproved: 0,
    weeklyApprovedHours: 0
  });

  // Handle Auth State with Domain Restriction
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 1. IMMEDIATE UI UPDATE
        // ALLOW ANY EMAIL
        if (currentUser.email) {
          setUser(currentUser);
          setAuthError(null);

          // 2. BACKGOUND SYNC (Don't await this for the UI)
          const syncUserToFirestore = async () => {
            try {
              // Determine role: if super admin email, force super_admin, else keep existing or default to user
              let role: UserRole = 'user';
              if (currentUser.email === SUPER_ADMIN_EMAIL) {
                role = 'super_admin';
              }

              await setDoc(doc(db, 'users', currentUser.email!), {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                lastSeen: serverTimestamp(),
                role: role
              }, { merge: true });

              // Force update super admin role if needed
              if (currentUser.email === SUPER_ADMIN_EMAIL) {
                await updateDoc(doc(db, 'users', currentUser.email!), { role: 'super_admin' });
              }
            } catch (e) {
              console.error("Error saving user (background):", e);
              // Optional: Set a non-blocking error toast here if needed
            }
          };

          syncUserToFirestore(); // Fire and forget
        }
      } else {
        setUser(null);
      }
      // 3. STOP LOADING IMMEDIATELY
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Registered Users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('lastSeen', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      setRegisteredUsers(users);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Submissions from Firestore (Real-time) - RE-ADDED FOR ADMIN VIEW
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSubmissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
      setSubmissions(fetchedSubmissions);
    }, (error) => {
      console.error("Error fetching submissions:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Derived State for Role
  const currentUserRole = useMemo<UserRole>(() => {
    if (!user || !user.email) return 'user';
    if (user.email === SUPER_ADMIN_EMAIL) return 'super_admin';

    const userDoc = registeredUsers.find(u => u.email === user.email);
    return (userDoc?.role as UserRole) || 'user';
  }, [user, registeredUsers]);

  const canApprove = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const canViewAll = currentUserRole === 'admin' || currentUserRole === 'super_admin';
  const canDelete = currentUserRole === 'super_admin';

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // const email = result.user.email;
      // No domain check needed anymore
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError("Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    setAuthError(null);
    signOut(auth);
  };

  const sendDiscordNotification = async (submission: Submission) => {
    // Find the user's Discord ID
    const user = registeredUsers.find(u => u.email === submission.email);
    const mention = user?.discordId ? `<@${user.discordId}>` : `**${submission.studentName}**`;

    const payload = {
      username: "Campus Health Leave",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/3063/3063191.png",
      embeds: [{
        title: "🆕 New Health Leave Application",
        description: `A new leave request has been submitted and is awaiting review.\n\n${mention}`,
        color: 1733608,
        fields: [
          { name: "Student Name", value: submission.studentName, inline: true },
          { name: "Email", value: submission.email, inline: true },
          { name: "Reason", value: submission.reason, inline: true },
          { name: "Leave Date", value: submission.date, inline: true },
          { name: "Duration", value: submission.leaveTime, inline: true },
          { name: "Status", value: "⏳ Pending Approval", inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    };

    setDiscordStatus("Sending notification...");
    try {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord Server Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      setDiscordStatus("Message sent successfully! ✅");
      setTimeout(() => setDiscordStatus(null), 5000);

    } catch (error: any) {
      console.error('Discord error:', error);
      setDiscordStatus(`❌ Failed: ${error.message || error}`);
    }
  };

  const sendDiscordApprovalNotification = async (submission: Submission) => {
    // Find the user's Discord ID
    const user = registeredUsers.find(u => u.email === submission.email);
    const mention = user?.discordId ? `<@${user.discordId}>` : `**${submission.studentName}**`;

    const payload = {
      username: "Health Coordinator",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
      // Moved ✅ to the second line next to the student name/mention
      content: `<@${DISCORD_MENTION_ID}> OK\n✅ ${mention}, Your leave for **${submission.date}** has been **Approved**! You are now cleared for health leave.`
    };

    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending Approval notification:', error);
    }
  };

  const sendDiscordRejectionNotification = async (submission: Submission, reason: string) => {
    // Find the user's Discord ID
    const user = registeredUsers.find(u => u.email === submission.email);
    const mention = user?.discordId ? `<@${user.discordId}>` : `**${submission.studentName}**`;

    const payload = {
      username: "Health Coordinator",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/1077/1077114.png",
      // Moved ❌ to the second line next to the student name/mention
      content: `<@${DISCORD_MENTION_ID}> OK\n❌ ${mention}, Your leave for **${submission.date}** has been **Rejected**.\n**Reason**: ${reason}`
    };

    try {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Error sending Rejection notification:', error);
    }
  };

  const isWithinLast7Days = (dateStr: string) => {
    try {
      const subDate = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - subDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } catch (e) {
      return false;
    }
  };

  const calculateStats = useCallback((data: Submission[]) => {
    const todayStr = getTodayString();
    const approvedData = data.filter(s => s.status === 'Approved');
    const rejectedData = data.filter(s => s.status === 'Rejected');
    const pendingData = data.filter(s => s.status === 'Pending');

    setStats({
      totalApproved: approvedData.length,
      totalRejected: rejectedData.length,
      pending: pendingData.length,
      approved: approvedData.length,
      campusTotal: registeredUsers.length,
      todayApproved: approvedData.filter(s => s.date === todayStr).length,
      weeklyApproved: approvedData.filter(s => isWithinLast7Days(s.date)).length,
      fullDayApproved: approvedData.filter(s => s.leaveTime === '1 Day').length,
      weeklyApprovedHours: approvedData
        .filter(s => isWithinLast7Days(s.date))
        .reduce((acc, curr) => acc + parseDurationToHours(curr.leaveTime), 0)
    });
  }, [registeredUsers]);

  useEffect(() => {
    // If Admin/SuperAdmin, calculate stats for ALL submissions.
    // If User, calculate stats ONLY for THEIR submissions.
    const dataForStats = canViewAll ? submissions : submissions.filter(s => s.email === user?.email);
    calculateStats(dataForStats);
  }, [submissions, calculateStats, canViewAll, user]);

  // Sync inputs with DB when user data loads
  useEffect(() => {
    if (user && registeredUsers.length > 0) {
      const userData = registeredUsers.find(u => u.email === user.email);
      if (userData) {
        setDiscordIdInput(userData.discordId || '');
        setHouseInput(userData.house || '');
      }
    }
  }, [user, registeredUsers]);

  const filteredSubmissions = useMemo(() => {
    // RBAC Filter: Users only see their own
    let result = canViewAll ? submissions : submissions.filter(s => s.email === user?.email);

    if (statusFilter === 'all') {
      result = result.filter(s => s.status === 'Approved');
    } else {
      result = result.filter(s => s.status === statusFilter);
    }

    if (statusFilter === 'all') {
      if (subFilter === 'today') result = result.filter(s => s.date === getTodayString());
      if (subFilter === 'weekly') result = result.filter(s => isWithinLast7Days(s.date));
      if (subFilter === 'weeklyHours') result = result.filter(s => isWithinLast7Days(s.date));
    }

    return result;
  }, [submissions, statusFilter, subFilter, user, canViewAll]);

  const handleAddSubmission = async (newSubmission: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => {
    // Generate a new document reference
    const newDocRef = doc(collection(db, "submissions"));

    const submission: Submission = {
      ...newSubmission,
      id: newDocRef.id, // Use Firestore ID
      status: 'Pending',
      submittedAt: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    try {
      // 1. Send Discord Notification FIRST (as per request)
      // This ensures the message goes even if the database fails due to permissions.
      await sendDiscordNotification(submission);

      // 2. Save to Firestore
      await setDoc(newDocRef, submission);

      setCurrentView('dashboard'); // Auto redirect
    } catch (error) {
      console.error("Error adding submission:", error);
      // Show actual error message to help debugging (especially for Permissions)
      alert(`Error: ${error.message || "Failed to submit"}. Check Firebase Console > Rules.`);
    }
  };

  const handleApprove = async (id: string) => {
    if (!canApprove) return; // Guard for non-admins

    const submission = submissions.find(s => s.id === id);
    if (submission) {
      try {
        await updateDoc(doc(db, 'submissions', id), {
          status: 'Approved'
        });
        sendDiscordApprovalNotification(submission);
      } catch (e) {
        console.error("Error approving submission:", e);
      }
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!canApprove) return; // Guard for non-admins

    try {
      await updateDoc(doc(db, 'submissions', id), {
        status: 'Rejected',
        rejectionReason: reason
      });

      const submission = submissions.find(s => s.id === id);
      if (submission) {
        sendDiscordRejectionNotification(submission, reason);
      }
    } catch (error) {
      console.error("Error rejecting document: ", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;

    try {
      await deleteDoc(doc(db, 'submissions', id));
      // No notification needed for deletion usually, or maybe add one if requested.
      // Firestore onSnapshot will auto-update the UI.
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Failed to delete record.");
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.email), {
        house: houseInput,
        discordId: discordIdInput
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowUserProfile(false);
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!canDelete) return;
    if (!window.confirm(`Are you sure you want to remove user ${email}? This will remove them from the list, but not delete their Google account.`)) return;

    try {
      await deleteDoc(doc(db, 'users', email));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to remove user.");
    }
  };

  const navigateToFilteredSubmissions = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setSubFilter('total');
    setCurrentView('submissions');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a73e8]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-22 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-40"></div>
        </div>

        <div className="max-w-5xl w-full flex flex-col md:flex-row items-center justify-center relative z-10">
          {/* Illustration Section */}
          {/* <div className="hidden md:flex flex-1 items-center justify-end -mr-16 lg:-mr-20 z-0">
            <img
              src="/login-character.png"
              alt="Student with laptop"
              className="w-full max-w-[500px] object-contain drop-shadow-2xl"
            />
          </div> */}

          {/* Login Card Section */}
          <div className="bg-white p-12 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-[480px] w-full relative z-10 border border-white/50 backdrop-blur-sm">
            {/* Navgurukul Logo/Brand */}
            <div className="flex justify-center mb-10">
              <div className="flex items-center gap-1">
                <span className="text-[#FF5722] font-bold text-3xl tracking-tighter">nav</span>
                <span className="text-gray-900 font-bold text-3xl tracking-tighter">gurukul</span>
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-[32px] font-extrabold text-[#1a1c1e] mb-3 leading-[1.2] tracking-tight">Campus Leves Dashboard</h1>
              <p className="text-gray-500 font-medium text-[15px]">Sign in to access your leave journey</p>
            </div>

            {/* Info Box */}
            <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-2xl p-5 mb-10 text-left flex items-start gap-4 mx-2">
              <div className="bg-[#2563eb] rounded-full p-1 mt-0.5 flex-shrink-0">
                <Info className="w-3.5 h-3.5 text-white stroke-[3px]" />
              </div>
              <div>
                <h3 className="text-[#1e40af] font-bold text-[14px] mb-1">Navgurukul Access Only</h3>
                <p className="text-[#1e3a8a]/80 text-[13px] leading-relaxed font-medium">
                  Only users with <span className="font-bold">@navgurukul.org</span> email addresses can access this platform.
                </p>
              </div>
            </div>

            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="px-2">
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] shadow-sm hover:shadow-md group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[15px]">Continue with Google</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 mt-10 font-medium">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans">
      <nav className="bg-[#fff9f2] border-b border-[#f0e4d7] px-6 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 flex items-center justify-center relative">
                <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="32" width="90" height="7" fill="#1a1c1e" rx="1" />
                  <path d="M42 22 V85" stroke="#e34c26" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <path d="M42 58 C25 58 12 68 12 76 C12 84 25 88 42 88" stroke="#e34c26" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <path d="M88 22 V85" stroke="#1a1c1e" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <path d="M88 58 C71 58 58 68 58 76 C58 84 71 88 88 88" stroke="#1a1c1e" strokeWidth="9" strokeLinecap="round" fill="none" />
                </svg>
                <div className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#fff9f2] shadow-sm animate-bounce">
                  OK
                </div>
              </div>
              <span className="text-[#1a1c1e] text-xl font-bold tracking-tight border-r border-gray-300 pr-6 mr-2 hidden md:block">Campus Health Leave</span>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => { setCurrentView('dashboard'); setStatusFilter('all'); setSubFilter('total'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${currentView === 'dashboard' ? 'text-[#1a73e8] bg-[#1a73e8]/5' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => { setCurrentView('form'); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${currentView === 'form' ? 'text-[#1a73e8] bg-[#1a73e8]/5' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Leave Form</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 hover:bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-200 group"
            >
              <div className="hidden lg:block leading-tight text-right">
                <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900">{user.displayName}</p>
                <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
              </div>
              <div className="relative">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                  alt="avatar"
                  className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                  }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                  <ChevronDown className="w-2.5 h-2.5 text-gray-500" />
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs font-bold text-gray-900">Signed in as</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => { setShowUserProfile(true); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Users className="w-4 h-4 text-gray-400" />
                    View Profile
                  </button>

                  {currentUserRole === 'super_admin' && (
                    <>
                      <div className="my-1 border-t border-gray-50" />
                      <button
                        onClick={() => { setShowAdminModal(true); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition-colors text-left"
                      >
                        <Shield className="w-4 h-4" />
                        Manage Admins
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-gray-50" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {currentView === 'form' ? (
        <div className="flex flex-col gap-4">
          {discordStatus && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 font-medium animate-in slide-in-from-top-2 ${discordStatus.includes('Failed') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
              {discordStatus.includes('Failed') ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              {discordStatus}
            </div>
          )}
          <SubmissionForm
            onSubmit={handleAddSubmission}
            onCancel={() => setCurrentView('dashboard')}
            userName={user.displayName || ''}
            userEmail={user.email || ''}
            onViewPending={() => navigateToFilteredSubmissions('Pending')}
          />
        </div>
      ) : currentView === 'submissions' ? (
        <main className="max-w-[1440px] mx-auto px-6 pt-10 pb-20 animate-in fade-in duration-300">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#1a1c1e] mb-1">
                {statusFilter === 'all' ? 'Approved Leaves' : statusFilter === 'Pending' ? 'Pending Applications' : statusFilter === 'Rejected' ? 'Rejected Leaves' : 'Leave Records'}
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                {statusFilter === 'all' ? 'Only showing approved and finalized leaves' : statusFilter === 'Rejected' ? 'Records of leaves that were not approved' : 'Items waiting for administrator review'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentView('dashboard'); setStatusFilter('all'); }}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 bg-white rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('form')}
                className="inline-flex items-center px-8 py-2.5 bg-[#1a73e8] text-white rounded-lg font-bold text-sm hover:bg-[#1557b0] transition-all shadow-md active:scale-95"
              >
                New Leave Form
              </button>
            </div>
          </div>

          {statusFilter === 'all' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { id: 'total', label: 'Total Approved', count: stats.totalApproved, icon: <ClipboardList className="w-4 h-4" />, color: '#1a73e8' },
                { id: 'today', label: 'Today Approved', count: stats.todayApproved, icon: <Sun className="w-4 h-4" />, color: '#f59e0b' },
                { id: 'weekly', label: 'Weekly Approved', count: stats.weeklyApproved, icon: <History className="w-4 h-4" />, color: '#1ea362' },
                { id: 'weeklyHours', label: 'Hours This Week', count: stats.weeklyApprovedHours, icon: <Clock className="w-4 h-4" />, color: '#e34c26' }
              ].map((box) => (
                <button
                  key={box.id}
                  onClick={() => setSubFilter(box.id as SubFilter)}
                  style={{
                    borderColor: box.id === subFilter ? box.color : '#f1f5f9',
                    backgroundColor: box.id === subFilter ? `${box.color}1A` : '#fcfcfc',
                    boxShadow: box.id === subFilter ? `0 4px 12px ${box.color}22` : 'none'
                  }}
                  className={`
                    p-4 rounded-xl border flex flex-col gap-2 transition-all relative
                    ${subFilter === box.id
                      ? 'ring-1'
                      : 'hover:border-gray-300 hover:bg-white'
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      style={{ backgroundColor: subFilter === box.id ? box.color : '#f3f4f6', color: subFilter === box.id ? '#fff' : '#9ca3af' }}
                      className="p-1.5 rounded-lg"
                    >
                      {box.icon}
                    </div>
                  </div>
                  <div className="text-left mt-1">
                    <p
                      style={{ color: subFilter === box.id ? box.color : '#9ca3af' }}
                      className="text-[11px] font-bold uppercase tracking-wider"
                    >
                      {box.label}
                    </p>
                    <h4 className="text-xl font-extrabold text-gray-900">{box.count}</h4>
                  </div>
                  {subFilter === box.id && (
                    <div style={{ backgroundColor: box.color }} className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-[#fafafa]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Showing: {statusFilter === 'all' ? 'Approved Records' : statusFilter === 'Pending' ? 'Pending Approvals' : 'Rejected Records'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-400">
                  {filteredSubmissions.length} record{filteredSubmissions.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {statusFilter === 'all' ? (
                subFilter === 'weeklyHours' ? (
                  <div className="p-6">
                    <WeeklyHoursList submissions={filteredSubmissions} />
                  </div>
                ) : (
                  <ApprovedTimeline
                    submissions={filteredSubmissions}
                    onDelete={canDelete ? handleDelete : undefined}
                  />
                )
              ) : (
                <SubmissionsTable
                  submissions={filteredSubmissions}
                  onApprove={canApprove ? handleApprove : undefined}
                  onReject={canApprove ? handleReject : undefined}
                  onDelete={canDelete ? handleDelete : undefined}
                />
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className="max-w-[1440px] mx-auto px-6 pt-10 pb-20 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-xl p-8 mb-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5 text-left">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                className="w-16 h-16 rounded-full border-4 border-white shadow-md"
                alt="profile"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                }}
              />
              <div>
                <h1 className="text-3xl font-bold text-[#1a1c1e] mb-1">Dashboard</h1>
                <p className="text-lg text-gray-500 font-medium">
                  Welcome back, {user.displayName?.split(' ')[0]}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider font-bold">
                    {currentUserRole.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('form')}
              className="inline-flex items-center px-8 py-2.5 bg-[#1a73e8] text-white rounded-lg font-bold text-sm hover:bg-[#1557b0] transition-all shadow-md active:scale-95"
            >
              Apply Leave Form
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div onClick={() => navigateToFilteredSubmissions('all')}>
              <DashboardCard
                title="Approved Leaves"
                subText={`${stats.totalApproved} total approved`}
                icon={<Target className="w-6 h-6 text-[#1a73e8]" />}
                isActive={statusFilter === 'all'}
                color="#1a73e8"
              />
            </div>
            <div onClick={() => navigateToFilteredSubmissions('Pending')}>
              <DashboardCard
                title="Pending Leaves"
                subText={`${stats.pending} waiting review`}
                icon={<Clock className="w-6 h-6 text-[#f59e0b]" />}
                badge={stats.pending > 0 ? stats.pending : undefined}
                isActive={statusFilter === 'Pending'}
                color="#f59e0b"
              />
            </div>
            <div onClick={() => navigateToFilteredSubmissions('Rejected')}>
              <DashboardCard
                title="Rejected Leaves"
                subText={`${stats.totalRejected} rejected requests`}
                icon={<XCircle className="w-6 h-6 text-[#d93025]" />}
                isActive={statusFilter === 'Rejected'}
                color="#d93025"
              />
            </div>
            <div onClick={() => setShowUserList(true)} className="cursor-pointer transition-transform active:scale-95">
              <DashboardCard
                title="Campus Strength"
                subText={`${stats.campusTotal} registered`}
                icon={<Users className="w-6 h-6 text-[#1ea362]" />}
                isActive={false}
                color="#1ea362"
              />
            </div>
          </div>
        </main>)
      }
      {
        showUserList && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserList(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#1a73e8]" />
                  Registered Users
                </h2>
                <button onClick={() => setShowUserList(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {registeredUsers.map((u, index) => (
                  <div key={u.email || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`}
                        className="w-10 h-10 rounded-full border border-gray-100"
                        alt="avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${u.displayName}&background=random`
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{u.displayName}</h3>
                        <p className="text-xs text-gray-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                    {canDelete && u.email !== SUPER_ADMIN_EMAIL && (
                      <button
                        onClick={() => handleDeleteUser(u.email)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {registeredUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-400">No users found</div>
                )}
              </div>
              <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                <p className="text-[10px] text-gray-400 font-medium">Showing all registered users</p>
              </div>
            </div>
          </div>
        )
      }

      <ManageAdminsModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        users={registeredUsers}
        currentUserEmail={user.email}
      />

      {
        showUserProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserProfile(false)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative" onClick={e => e.stopPropagation()}>
              {/* Header Background */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative">
                <button onClick={() => setShowUserProfile(false)} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-8">
                <div className="relative -mt-16 mb-6 flex flex-col items-center">
                  <div className="p-1 bg-white rounded-full shadow-lg">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
                      className="w-28 h-28 rounded-full border-4 border-orange-200"
                      alt="profile"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName}&background=random`
                      }}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mt-3">{user.displayName}</h2>
                </div>

                <div className="space-y-4">
                  {/* Email Section */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Email</span>
                    </div>
                    <p className="text-gray-900 font-medium pl-6">{user.email}</p>
                  </div>

                  {/* Date Joined */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Date Joined</span>
                    </div>
                    <p className="text-gray-900 font-medium pl-6">
                      {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      }) : 'December 20, 2025'}
                    </p>
                  </div>

                  {/* Campus */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Building className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Campus</span>
                    </div>
                    <div className="pl-6">
                      <select disabled className="w-full p-2.5 bg-gray-200 border border-gray-300 rounded-lg text-gray-500 font-medium cursor-not-allowed appearance-none">
                        <option>Dharamshala</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Contact admin to change campus</p>
                    </div>
                  </div>

                  {/* House */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Building className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">House</span>
                    </div>
                    <div className="pl-6">
                      <select
                        onChange={(e) => setHouseInput(e.target.value)}
                        value={houseInput}
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer hover:border-blue-400"
                      >
                        <option value="" disabled>Select your house</option>
                        <option value="Bhairav">Bhairav</option>
                        <option value="Malhar">Malhar</option>
                        <option value="Bageshree">Bageshree</option>
                      </select>
                    </div>
                  </div>

                  {/* Discord ID */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Hash className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Discord User ID</span>
                    </div>
                    <div className="pl-6 relative">
                      <input
                        type={showDiscordId ? "text" : "password"}
                        placeholder="Enter your Discord ID"
                        value={discordIdInput}
                        onChange={(e) => setDiscordIdInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-2.5 pr-10 bg-white border border-gray-200 rounded-lg text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 hover:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDiscordId(!showDiscordId)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showDiscordId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || saveSuccess}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${saveSuccess
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                      }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Saved Data Successfully
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4" /> {/* Spacer for alignment or icon if needed */}
                        Save Changes
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-all hover:shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default App;