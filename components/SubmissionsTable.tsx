
import React, { useState } from 'react';
import { Submission } from '../types';
import { CheckCircle, Clock, CalendarDays, XCircle, Send } from 'lucide-react';

interface SubmissionsTableProps {
  submissions: Submission[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, onApprove, onReject }) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleRejectSubmit = (id: string) => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    onReject(id, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Leave Date</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason & Time</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submission Time</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {submissions.map((submission) => (
          <tr key={submission.id} className="hover:bg-gray-50/80 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{submission.studentName}</span>
                <span className="text-xs text-gray-500">{submission.email}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                {submission.date}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col gap-1.5">
                <span className="inline-block w-fit px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-orange-50 text-orange-700 border border-orange-100">
                  {submission.reason}
                </span>
                <span className="text-xs text-gray-500 font-medium italic">
                  Duration: {submission.leaveTime}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium">
                  {submission.submittedAt.split(',')[1]?.trim() || submission.submittedAt}
                </span>
                <span className="text-[10px] text-gray-400">
                  {submission.submittedAt.split(',')[0]}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {submission.status === 'Approved' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle className="w-3 h-3" />
                  Approved
                </span>
              ) : submission.status === 'Rejected' ? (
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200 w-fit">
                    <XCircle className="w-3 h-3" />
                    Rejected
                  </span>
                  {submission.rejectionReason && (
                    <span className="text-[10px] text-red-500 italic max-w-[150px] truncate" title={submission.rejectionReason}>
                      Reason: {submission.rejectionReason}
                    </span>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              {submission.status === 'Pending' ? (
                rejectingId === submission.id ? (
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Why rejecting?" 
                        className="text-[13px] bg-[#313338] text-gray-200 border-none rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00a8fc] w-48 placeholder:text-[#949ba4]"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRejectSubmit(submission.id)}
                      />
                    </div>
                    <button 
                      onClick={() => handleRejectSubmit(submission.id)}
                      className="p-2 bg-[#da373c] text-white rounded-md hover:bg-[#b22d31] transition-colors flex items-center justify-center shadow-sm"
                      title="Confirm Rejection"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="text-[13px] text-[#00a8fc] hover:underline font-medium px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApprove(submission.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(submission.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                )
              ) : (
                <span className="text-gray-400 text-xs italic bg-gray-50 px-2 py-1 rounded">
                  {submission.status === 'Approved' ? 'Confirmed' : 'Dismissed'}
                </span>
              )}
            </td>
          </tr>
        ))}
        {submissions.length === 0 && (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
              No submissions found for this category.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default SubmissionsTable;
