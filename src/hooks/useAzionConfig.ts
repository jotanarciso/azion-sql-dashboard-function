'use client';

import { useState, useEffect } from 'react';
import { configureAzionClient, clearAzionClient } from '@/lib/azion-client';

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

export function useAzionConfig() {
  const [token, setToken] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [storageAvailable] = useState(isLocalStorageAvailable());

  useEffect(() => {
    // Carregar token do localStorage com tratamento de erro
    if (storageAvailable) {
      try {
        const savedToken = localStorage.getItem('azion_token');
        if (savedToken) {
          setToken(savedToken);
          configureAzionClient(savedToken);
          setIsConfigured(true);
        }
      } catch (error) {
        console.warn('Erro ao acessar localStorage:', error);
        // Limpar qualquer estado inconsistente
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
    configureAzionClient(newToken);
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

  return {
    token,
    isConfigured,
    saveToken,
    clearToken,
  };
} 