import React from 'react'; 
import { useNavigate } from 'react-router-dom'; 
 
const Dashboard: React.FC = () => { 
  const navigate = useNavigate(); 
 
  return ( 
    <div className="space-y-6"> 
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1> 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
        <div className="bg-white p-6 rounded-lg shadow-sm border"> 
          <h3 className="text-lg font-medium mb-2">Nieuw Gesprek</h3> 
          <p className="text-gray-600 mb-4">Start een nieuwe gespreksessie</p> 
          <button 
            onClick={() => navigate('/meetings/create')} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" 
          > 
            Gesprek Starten 
          </button> 
        </div> 
        <div className="bg-white p-6 rounded-lg shadow-sm border"> 
          <h3 className="text-lg font-medium mb-2">Recente Gesprekken</h3> 
          <p className="text-gray-600 mb-4">Bekijk je laatst gevoerde gesprekken</p> 
          <button 
            onClick={() => navigate('/meetings')} 
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" 
          > 
            Bekijk Gesprekken 
          </button> 
        </div> 
        <div className="bg-white p-6 rounded-lg shadow-sm border"> 
          <h3 className="text-lg font-medium mb-2">Instellingen</h3> 
          <p className="text-gray-600 mb-4">Beheer je voorkeuren</p> 
          <button 
            onClick={() => navigate('/settings')} 
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700" 
          > 
            Instellingen 
          </button> 
        </div> 
      </div> 
    </div> 
  ); 
}; 
 
export default Dashboard; 
