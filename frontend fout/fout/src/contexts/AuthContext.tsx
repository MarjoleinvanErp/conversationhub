import React, { createContext, useContext, useState, ReactNode } from 'react'; 
 
interface User { 
  id: string; 
  name: string; 
  email: string; 
} 
 
interface AuthContextType { 
  user: User | null; 
  isAuthenticated: boolean; 
  loading: boolean; 
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void; 
} 
 
const AuthContext = createContext<AuthContextType | undefined>(undefined); 
 
export const useAuth = () => { 
  const context = useContext(AuthContext); 
  if (!context) throw new Error('useAuth must be used within AuthProvider'); 
  return context; 
}; 
 
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => { 
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(false); 
 
  const login = async (email: string, password: string) => { 
    setLoading(true); 
    // TODO: Implement API call 
    setUser({ id: '1', name: 'Test User', email }); 
    setLoading(false); 
  }; 
 
  const logout = () => setUser(null); 
 
  return ( 
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}> 
      {children} 
    </AuthContext.Provider> 
  ); 
}; 
