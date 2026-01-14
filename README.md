# Student Health Leave Dashboard 🏥

A modern, responsive web application designed for university campuses to streamline the process of student health leave applications. The system allows students to submit leave requests and enables administrators to manage, approve, or reject them efficiently, with real-time Discord notifications.

![Dashboard Preview](https://placehold.co/800x400?text=Dashboard+Preview)
*(Note: Replace with actual screenshot)*

## 🚀 Features

### for Students
- **Easy Submission:** Simple and intuitive form to apply for health leave.
- **Real-time Status:** View the status of your applications (Pending, Approved, Rejected) in real-time.
- **Dashboard Overview:** Track your leave history and see approved leave statistics.
- **Google Sign-In:** Secure and quick login using University/Google accounts.

### for Administrators
- **Centralized Dashboard:** View global statistics including total approved, rejected, and pending leaves.
- **Application Management:** Review student applications with detailed information.
- **Approve/Reject Actions:** One-click approval or rejection of leave requests through the UI.
- **Role Management:** Super Admins can manage other admins directly from the dashboard.
- **Discord Integration:** Automated notifications sent to a Discord channel for:
    - New Leave Submissions 🆕
    - Approvals ✅
    - Rejections ❌

## 🛠️ Tech Stack

- **Frontend:** [React](https://reactjs.org/) (Create Vite App)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
- **Backend / Database:** [Firebase](https://firebase.google.com/)
    - **Authentication:** Google Sign-In
    - **Firestore:** NoSQL database for storing users and submissions
- **Icons:** [Lucide React](https://lucide.dev/)
- **Notifications:** Discord Webhooks

## ⚙️ Installation & Setup

Follow these steps to get the project running locally.

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/student-health-leave-dashboard.git
cd student-health-leave-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
This project uses Firebase. You need to set up a project in the [Firebase Console](https://console.firebase.google.com/).

1. Create a new project.
2. Enable **Authentication** (Google Sign-In).
3. Enable **Firestore Database**.
4. Copy your web app's Firebase configuration.
5. Update `src/firebase.ts` or create a `.env` file with your credentials (recommended for security).

### 4. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`.

## 📁 Project Structure

```
student-health-leave-dashboard/
├── src/
│   ├── components/         # Reusable UI components (Forms, Tables, Cards)
│   ├── App.tsx            # Main application logic and routing
│   ├── firebase.ts        # Firebase configuration and initialization
│   ├── types.ts           # TypeScript interfaces and types
│   └── index.css          # Global styles (Tailwind imports)
├── public/                # Static assets
└── package.json           # Project dependencies
```

## 🔐 Role-Based Access

The application automates roles based on specific criteria (customizable in `App.tsx`):
- **Super Admin:** Hardcoded email (e.g., `bhelavevicky66@gmail.com`) has full control.
- **Admins:** Can be added/removed by the Super Admin via the "Manage Admins" modal.
- **Users:** Default role for all students signing in.

## 🔔 Discord Configuration

To enable Discord notifications:
1. Create a Webhook in your Discord Server Settings > Integrations > Webhooks.
2. Copy the Webhook URL.
3. Update the `DISCORD_WEBHOOK_URL` constant in `App.tsx` (or move to environment variables).

## 📄 License

This project is licensed under the MIT License.
