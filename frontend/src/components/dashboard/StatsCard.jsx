// src/components/dashboard/StatsCard.jsx
import React from 'react';

const StatsCard = ({ label, value, icon: Icon, color }) => {
  const iconElement = typeof Icon === 'function' 
    ? <Icon size={20} className={color} /> 
    : Icon;
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {iconElement}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
};

export default StatsCard;