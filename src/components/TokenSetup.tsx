'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAzionConfig } from '@/contexts/AzionConfigContext';
import { getAzionClient } from '@/lib/azion-client';

export function TokenSetup() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { saveToken } = useAzionConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Token is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Enviar token para ser criptografado e armazenado no backend
      const response = await fetch('/api/auth/store-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(`Authentication failed: ${errorData.error || `HTTP ${response.status}`}`);
        return;
      }

      const { sessionId } = await response.json();
      
      // Salvar apenas o sessionId no localStorage
      saveToken(sessionId);
      
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(`Authentication failed: ${err.message || 'Unknown error'}`);
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
            Enter your Azion Personal Token to get started
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
                placeholder="Enter your token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-gray-500">
                You can find your Personal Token in the{' '}
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
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 