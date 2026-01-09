
import React from 'react';

interface DashboardCardProps {
  title: string;
  subText: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: number;
  color?: string; // Hex color code for the theme
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, subText, icon, isActive, badge, color = '#1a73e8' }) => {
  // Create light background color from the main color (adding transparency)
  const bgColor = `${color}0D`; // ~5% opacity for background
  const ringColor = `${color}33`; // ~20% opacity for ring
  const activeRingColor = `${color}66`; // ~40% opacity for active ring

  return (
    <div 
      style={{ 
        borderColor: color, 
        backgroundColor: bgColor,
        boxShadow: isActive ? `0 4px 12px ${ringColor}` : 'none'
      }}
      className={`
        relative p-6 rounded-xl flex flex-col gap-4 cursor-pointer transition-all duration-200
        border ring-1
        ${isActive ? 'ring-2' : 'hover:shadow-sm opacity-95 hover:opacity-100'}
      `}
      className-temp={isActive ? '' : ''} /* Helper for tailwind mapping if needed */
      // We use style for the dynamic colors to ensure they match exactly without tailwind config changes
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.boxShadow = `0 2px 8px ${ringColor}`;
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="p-1 rounded flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 font-medium">{subText}</p>
      </div>
      {badge && (
        <div 
          style={{ backgroundColor: color }}
          className="absolute top-4 right-4 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
        >
          {badge}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
