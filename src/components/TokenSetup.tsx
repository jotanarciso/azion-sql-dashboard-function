'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAzionConfig } from '@/hooks/useAzionConfig';

interface TokenSetupProps {
  onConfigured: () => void;
}

export function TokenSetup({ onConfigured }: TokenSetupProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveToken } = useAzionConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Por favor, insira o token');
      return;
    }

    // Validação básica do formato do token
    const cleanToken = token.trim();
    if (cleanToken.length < 10) {
      setError('Token muito curto. Verifique se copiou corretamente.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Salvar token e configurar cliente
      saveToken(cleanToken);
      
      // Pequeno delay para dar tempo do cliente ser configurado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      onConfigured();
    } catch (err) {
      setError('Erro ao configurar token. Tente novamente.');
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Azion SQL Dashboard
          </CardTitle>
          <CardDescription>
            Insira seu Personal Token da Azion para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Token
              </label>
              <Input
                id="token"
                type="password"
                placeholder="Digite seu token aqui..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-gray-500">
                Você pode encontrar seu Personal Token no{' '}
                <a 
                  href="https://manager.azion.com/personal-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  Azion Console
                </a>
              </p>
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? 'Configurando...' : 'Conectar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 