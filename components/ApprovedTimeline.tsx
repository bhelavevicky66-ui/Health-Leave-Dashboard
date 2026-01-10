import React, { useMemo } from 'react';
import { Submission } from '../types';
import { Calendar, CheckCircle2, User, Clock } from 'lucide-react';

interface ApprovedTimelineProps {
    submissions: Submission[];
}

const ApprovedTimeline: React.FC<ApprovedTimelineProps> = ({ submissions }) => {
    // Group submissions by date
    const groupedSubmissions = useMemo(() => {
        const groups: { [key: string]: Submission[] } = {};

        submissions.forEach(sub => {
            if (!groups[sub.date]) {
                groups[sub.date] = [];
            }
            groups[sub.date].push(sub);
        });

        // Sort dates (assuming standard date string, might need parsing if format varies)
        // The current format is "January 9, 2026", which Date.parse handles well usually.
        return Object.entries(groups).sort((a, b) => {
            return new Date(b[0]).getTime() - new Date(a[0]).getTime();
        });
    }, [submissions]);

    return (
        <div className="flex flex-col gap-6">
            {groupedSubmissions.map(([date, subs]) => (
                <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <h3 className="text-gray-700 font-bold text-sm">{date}</h3>
                    </div>

                    <div className="flex flex-col gap-3 pl-0 md:pl-4">
                        {subs.map(sub => (
                            <div
                                key={sub.id}
                                className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all"
                            >
                                {/* Green accent line on left */}
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-green-500 rounded-l-lg"></div>

                                <div className="pl-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        <span className="font-bold text-gray-800 text-sm">Health Leave</span>
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                            Approved
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        <span className="font-bold text-gray-900">Reason: </span>
                                        {sub.reason}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            {sub.studentName}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            Duration: {sub.leaveTime}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {submissions.length === 0 && (
                <div className="text-center py-10 text-gray-400 font-medium">
                    No approved leaves found.
                </div>
            )}
        </div>
    );
};

export default ApprovedTimeline;
