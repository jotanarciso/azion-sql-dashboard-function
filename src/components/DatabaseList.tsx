'use client';

import { useState, useEffect } from 'react';
import { getAzionClient } from '@/lib/azion-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, Settings } from 'lucide-react';

interface Database {
  id: number;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface DatabaseListProps {
  onDatabaseSelect: (database: Database) => void;
  onLogout: () => void;
}

export function DatabaseList({ onDatabaseSelect, onLogout }: DatabaseListProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDatabases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const client = getAzionClient();
      const { data, error: dbError } = await client.getDatabases();
      
      if (dbError) {
        setError(`Erro ao carregar bancos: ${dbError.message}`);
        return;
      }

      if (data?.databases) {
        setDatabases(data.databases);
      }
    } catch (err) {
      setError('Erro inesperado ao carregar bancos de dados');
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabases();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando bancos de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Azion SQL Dashboard</h1>
            <p className="text-gray-600 mt-2">Gerencie seus bancos de dados SQL</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDatabases} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {databases.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhum banco de dados encontrado</p>
                <p className="text-sm text-gray-400 mt-2">
                  Crie um banco usando a Azion CLI ou Console
                </p>
              </CardContent>
            </Card>
          ) : (
            databases.map((database) => (
              <Card
                key={database.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  !['active', 'created'].includes(database.status) ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => {
                  if (['active', 'created'].includes(database.status)) {
                    onDatabaseSelect(database);
                  } else {
                    alert(`Banco não está disponível. Status: ${database.status}`);
                  }
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {database.name}
                  </CardTitle>
                  <CardDescription>
                    ID: {database.id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Client ID: {database.clientId}</p>
                    <p>Status: <span className={`font-medium ${
                      ['active', 'created'].includes(database.status) ? 'text-orange-600' : 
                      database.status === 'deletion_failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {database.status}
                    </span></p>
                    <p>Criado: {new Date(database.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p>Atualizado: {new Date(database.updatedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {!['active', 'created'].includes(database.status) && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      ⚠️ Banco não está ativo. Status: {database.status}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 