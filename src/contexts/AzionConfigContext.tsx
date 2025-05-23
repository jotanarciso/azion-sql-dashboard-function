'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { clearAzionClient } from '@/lib/azion-client';

// Verificar se localStorage está disponível
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

interface AzionConfigContextType {
  token: string;
  isConfigured: boolean;
  saveToken: (newToken: string) => void;
  clearToken: () => void;
}

const AzionConfigContext = createContext<AzionConfigContextType | undefined>(undefined);

export function AzionConfigProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [storageAvailable] = useState(isLocalStorageAvailable());

  useEffect(() => {
    if (storageAvailable) {
      try {
        const savedToken = localStorage.getItem('azion_token');
        if (savedToken) {
          setToken(savedToken);
          setIsConfigured(true);
        }
      } catch (error) {
        console.warn('Erro ao acessar localStorage:', error);
        setToken('');
        setIsConfigured(false);
      }
    }
  }, [storageAvailable]);

  const saveToken = (newToken: string) => {
    if (storageAvailable) {
      try {
        localStorage.setItem('azion_token', newToken);
      } catch (error) {
        console.error('Erro ao salvar token no localStorage:', error);
      }
    }
    setToken(newToken);
    setIsConfigured(true);
  };

  const clearToken = () => {
    if (storageAvailable) {
      try {
        localStorage.removeItem('azion_token');
      } catch (error) {
        console.warn('Erro ao remover token do localStorage:', error);
      }
    }
    setToken('');
    clearAzionClient();
    setIsConfigured(false);
  };

  return (
    <AzionConfigContext.Provider 
      value={{
        token,
        isConfigured,
        saveToken,
        clearToken,
      }}
    >
      {children}
    </AzionConfigContext.Provider>
  );
}

export function useAzionConfig() {
  const context = useContext(AzionConfigContext);
  if (context === undefined) {
    throw new Error('useAzionConfig must be used within an AzionConfigProvider');
  }
  return context;
} 