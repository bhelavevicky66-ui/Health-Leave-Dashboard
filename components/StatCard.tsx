
import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 text-white shadow-lg transition-transform hover:scale-[1.02] duration-200`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
          <h3 className="text-4xl font-bold mt-2">{value}</h3>
        </div>
        <div className="p-2 rounded-lg bg-white/10">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
