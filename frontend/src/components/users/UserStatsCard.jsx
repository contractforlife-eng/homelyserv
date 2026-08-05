// frontend/src/components/users/UserStatsCard.jsx
// Shared stat card component for user profile pages (support & admin).
import React from 'react';

const UserStatsCard = ({ label, value, icon: Icon, color = 'text-green-600', bg = 'bg-green-50 dark:bg-green-900/30' }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
  );
};

export default UserStatsCard;