import React from 'react'; 
import { Outlet } from 'react-router-dom'; 
import Header from './components/Header'; 
import Sidebar from './components/Sidebar'; 
import { useAuth } from '@/contexts/AuthContext'; 
 
const MainLayout: React.FC = () => { 
  const { isAuthenticated } = useAuth(); 
 
  if (!isAuthenticated) { 
    return <div>Please log in</div>; 
  } 
 
  return ( 
    <div className="min-h-screen bg-gray-50"> 
      <Header /> 
      <div className="flex"> 
        <Sidebar /> 
        <main className="flex-1 p-6"> 
          <Outlet /> 
        </main> 
      </div> 
    </div> 
  ); 
}; 
 
export default MainLayout; 
