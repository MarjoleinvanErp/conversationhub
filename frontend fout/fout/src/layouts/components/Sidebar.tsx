import React from 'react'; 
import { NavLink } from 'react-router-dom'; 
 
const Sidebar: React.FC = () => { 
  const navItems = [ 
    { path: '/dashboard', label: 'Dashboard', icon: '📊' }, 
    { path: '/meetings', label: 'Gesprekken', icon: '💬' }, 
    { path: '/meetings/create', label: 'Nieuw Gesprek', icon: '➕' }, 
    { path: '/settings', label: 'Instellingen', icon: '⚙️' }, 
  ]; 
 
  return ( 
    <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen"> 
      <div className="p-4"> 
        <ul className="space-y-2"> 
          {navItems.map((item) => ( 
            <li key={item.path}> 
              <NavLink 
                to={item.path} 
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${ 
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' 
                  }` 
                } 
              > 
                <span className="mr-3">{item.icon}</span> 
                {item.label} 
              </NavLink> 
            </li> 
          ))} 
        </ul> 
      </div> 
    </nav> 
  ); 
}; 
 
export default Sidebar; 
