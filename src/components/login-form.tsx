import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { encryptToken } from '@/lib/crypto-utils';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/store-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error validating token');
      }

      const encryptedToken = await encryptToken(token);
      localStorage.setItem('azion_token', encryptedToken);
      
      toast.success('Login successful!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Azion Token</Label>
        <Input
          id="token"
          type="password"
          placeholder="Enter your Azion token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          className="bg-white text-gray-900 placeholder:text-gray-500"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.azion.com/v4/edge_sql/databases', {
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
} 