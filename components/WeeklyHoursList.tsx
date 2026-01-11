import React, { useMemo } from 'react';
import { Submission } from '../types';
import { Clock, User } from 'lucide-react';

interface WeeklyHoursListProps {
    submissions: Submission[];
}

const parseDurationToHours = (duration: string | undefined): number => {
    if (!duration) return 0;
    const d = duration.toLowerCase();
    if (d.includes('1 day')) return 9;
    if (d.includes('first half')) return 4;
    if (d.includes('second half')) return 3;
    if (d.includes('half')) return 3;
    if (d.includes('2 hours')) return 2;
    if (d.includes('4 hours')) return 4;
    if (d.includes('1 hour')) return 1;
    const match = d.match(/(\d+)\s*hour/);
    if (match) return parseInt(match[1], 10);
    return 0;
};

const WeeklyHoursList: React.FC<WeeklyHoursListProps> = ({ submissions }) => {
    const userHours = useMemo(() => {
        const hoursMap = new Map<string, { name: string; hours: number; photoURL?: string }>();

        submissions.forEach((sub) => {
            const email = sub.email;
            const hours = parseDurationToHours(sub.leaveTime);
            const current = hoursMap.get(email) || { name: sub.studentName, hours: 0 };

            hoursMap.set(email, {
                name: sub.studentName,
                hours: current.hours + hours,
                photoURL: undefined // We don't have photoURL in submission, but display name is there
            });
        });

        return Array.from(hoursMap.values()).sort((a, b) => b.hours - a.hours);
    }, [submissions]);

    return (
        <div className="space-y-4">
            {userHours.map((userData, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                            {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{userData.name}</h3>
                            <p className="text-xs text-gray-500 font-medium">Total Weekly Leave</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold font-mono text-lg">{userData.hours}</span>
                        <span className="text-xs font-bold uppercase tracking-wide">Hours</span>
                    </div>
                </div>
            ))}

            {userHours.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No approved leave hours recorded this week.</p>
                </div>
            )}
        </div>
    );
};

export default WeeklyHoursList;
