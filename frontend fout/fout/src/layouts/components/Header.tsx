import React from 'react'; 
import { useAuth } from '@/contexts/AuthContext'; 
 
const Header: React.FC = () => { 
  const { user, logout } = useAuth(); 
 
  return ( 
    <header className="bg-white shadow-sm border-b border-gray-200"> 
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
        <div className="flex justify-between items-center h-16"> 
          <h1 className="text-xl font-semibold text-gray-900">ConversationHub</h1> 
          <div className="flex items-center space-x-4"> 
            <span>Welkom, {user?.name}</span> 
            <button onClick={logout} className="text-red-600 hover:text-red-800"> 
              Uitloggen 
            </button> 
          </div> 
        </div> 
      </div> 
    </header> 
  ); 
}; 
 
export default Header; 
