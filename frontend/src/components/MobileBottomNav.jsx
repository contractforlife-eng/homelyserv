import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Briefcase, MessageCircle, User } from 'lucide-react';

function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/my-hires', icon: Briefcase, label: 'Hires' },
    { path: '/messages', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 min-h-[44px] min-w-[44px] transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default MobileBottomNav;