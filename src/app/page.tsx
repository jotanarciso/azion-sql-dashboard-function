'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/login-form';
import { DatabaseList } from '@/components/DatabaseList';
import { DatabaseExplorer } from '@/components/DatabaseExplorer';
import { clearAzionClient } from '@/lib/azion-client';

export const runtime = 'edge';

interface Database {
  id: number;
  name: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  deleted_at: string | null;
  is_active: boolean;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);

  useEffect(() => {
    // Verificar se há token no localStorage
    const token = localStorage.getItem('azion_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('azion_token');
    clearAzionClient();
    setIsLoggedIn(false);
    setSelectedDatabase(null);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleDatabaseSelect = (database: Database) => {
    setSelectedDatabase(database);
  };

  const handleBack = () => {
    setSelectedDatabase(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Azion SQL Dashboard</h1>
            <p className="text-gray-600 mt-2">Enter your Azion token to get startedr</p>
          </div>
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  if (selectedDatabase) {
    return (
      <DatabaseExplorer
        database={selectedDatabase}
        onBack={handleBack}
      />
    );
  }

  return (
    <DatabaseList
      onDatabaseSelect={handleDatabaseSelect}
      onLogout={handleLogout}
    />
  );
}
