
import React, { useState } from 'react';
import { LeaveTime, LeaveReason, Submission } from '../types';

interface SubmissionFormProps {
  onSubmit: (data: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => void;
  onCancel: () => void;
  userName: string;
  userEmail: string;
  onViewPending?: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, onCancel, userName, userEmail, onViewPending }) => {
  const [submitted, setSubmitted] = useState(false);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const [formData, setFormData] = useState({
    studentName: userName,
    email: userEmail,
    date: todayFormatted,
    reason: '' as LeaveReason,
    leaveTime: '' as LeaveTime
  });

  const reasons: LeaveReason[] = ['Fever', 'Headache', 'Stomach', 'Unwell', 'Body Pain'];
  const times: LeaveTime[] = ['1 Day', 'First Half', 'Second Half', '2 Hours', '4 Hours', '1 Hour'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason || !formData.leaveTime) {
      alert("Please fill all required fields");
      return;
    }
    onSubmit(formData);
    // User requested immediate redirect to Pending list
    if (onViewPending) {
      onViewPending();
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#f0ebf8] min-h-screen flex flex-col items-center pt-12 px-4 font-sans text-[#202124]">
        <div className="w-full max-w-[640px] bg-white rounded-lg border border-[#dadce0] overflow-hidden shadow-sm">
          <div className="h-2.5 bg-[#673ab7]"></div>
          <div className="p-8">
            <h1 className="text-[32px] font-bold text-black mb-4 leading-tight">Student Health Leaves Form</h1>
            <p className="text-sm text-gray-900 mb-6">Your response has been recorded</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSubmitted(false)}
                className="text-[#673ab7] text-sm hover:underline w-fit"
              >
                Submit another response
              </button>
              <button
                onClick={onViewPending}
                className="text-[#673ab7] text-sm hover:underline w-fit font-bold"
              >
                Check Pending Approvals
              </button>
              <button
                onClick={onCancel}
                className="text-gray-500 text-sm hover:underline w-fit pt-2"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-gray-600 space-y-2">
          <p>This form was created inside of NavGurukul. - <span className="underline cursor-pointer">Contact form owner</span></p>
          <p>Does this form look suspicious? <span className="underline cursor-pointer">Report</span></p>
          <div className="flex items-center justify-center gap-1 text-lg font-medium text-gray-500 mt-6 grayscale opacity-60">
            <span className="font-bold">Google</span> Forms
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0ebf8] min-h-screen p-2 sm:p-4 font-sans text-[#202124]">
      <div className="max-w-[640px] mx-auto space-y-3 pb-12">

        {/* Header Card */}
        <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden shadow-sm">
          <div className="h-2.5 bg-[#673ab7]"></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-[32px] font-normal text-black flex items-center gap-2">
                Student Health Leaves Form
              </h1>
              <button
                type="button"
                onClick={onCancel}
                className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1 bg-white text-gray-700 font-medium"
              >
                Back
              </button>
            </div>
            <p className="text-sm mt-4">Official application for medical leave. Once submitted, your request will appear in the Pending section for review.</p>
            <p className="text-[#d93025] text-sm mt-4 font-medium">* Indicates required question</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Card - Auto-filled */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm">
            <label className="block text-base mb-6 text-black">Email <span className="text-[#d93025]">*</span></label>
            <div className="w-full border-b border-[#dadce0] py-2 text-sm text-black bg-[#fafafa]">
              {userEmail}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
              <input checked readOnly type="checkbox" id="record-email" className="w-4 h-4 rounded border-[#dadce0] accent-[#673ab7] bg-white" />
              <label htmlFor="record-email" className="cursor-pointer">Record your email as the email to be included with my response</label>
            </div>
          </div>

          {/* Date Card - Auto-filled */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm">
            <label className="block text-base mb-2 text-black">Date <span className="text-[#d93025]">*</span></label>
            <div className="text-base mb-1 font-normal text-black">{todayFormatted}</div>
            <div className="text-xs text-gray-500 italic">Automatically captured based on today's date.</div>
          </div>

          {/* Name Card - Auto-filled */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm">
            <label className="block text-base mb-6 text-black">Your Name <span className="text-[#d93025]">*</span></label>
            <div className="w-full border-b border-[#dadce0] py-2 text-sm text-black bg-[#fafafa]">
              {userName}
            </div>
          </div>

          {/* Reason Card */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm">
            <label className="block text-base mb-6 text-black">Reason <span className="text-[#d93025]">*</span></label>
            <div className="space-y-4">
              {reasons.map((r) => (
                <label key={r} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="reason"
                      required
                      className="peer appearance-none w-5 h-5 border-2 border-[#dadce0] rounded-full checked:border-[#673ab7] transition-all bg-white"
                      checked={formData.reason === r}
                      onChange={() => setFormData(prev => ({ ...prev, reason: r }))}
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-[#673ab7] scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                  <span className="text-sm text-black">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Leave Time Card */}
          <div className="bg-white rounded-lg border border-[#dadce0] p-6 shadow-sm">
            <label className="block text-base mb-6 text-black">Leave Time <span className="text-[#d93025]">*</span></label>
            <div className="space-y-4">
              {times.map((t) => (
                <label key={t} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="leaveTime"
                      required
                      className="peer appearance-none w-5 h-5 border-2 border-[#dadce0] rounded-full checked:border-[#673ab7] transition-all bg-white"
                      checked={formData.leaveTime === t}
                      onChange={() => setFormData(prev => ({ ...prev, leaveTime: t }))}
                    />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-[#673ab7] scale-0 peer-checked:scale-100 transition-transform"></div>
                  </div>
                  <span className="text-sm text-black">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-2 pb-10">
            <button
              type="submit"
              className="bg-[#673ab7] text-white px-6 py-2 rounded font-medium text-sm hover:bg-[#5e35b1] transition-colors shadow-sm active:scale-95"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, reason: '' as LeaveReason, leaveTime: '' as LeaveTime }));
              }}
              className="text-[#673ab7] font-medium text-sm hover:bg-[#673ab7]/5 px-4 py-2 rounded transition-colors"
            >
              Clear form
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center pt-6 space-y-1">
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest opacity-60">Google Forms</div>
          <div className="text-[10px] text-gray-400">This content is neither created nor endorsed by Student Health Services.</div>
          <div className="flex justify-center gap-2 text-[10px] text-gray-400">
            <a href="#" className="underline">Report Abuse</a> -
            <a href="#" className="underline">Terms of Service</a> -
            <a href="#" className="underline">Privacy Policy</a>
          </div>
          <div className="text-[10px] text-red-500 font-semibold uppercase">Never submit passwords through Google Forms.</div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;
