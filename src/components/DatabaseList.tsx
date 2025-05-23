'use client';

import { useState, useEffect } from 'react';
import { getAzionClient } from '@/lib/azion-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Database, RefreshCw, Settings, Trash2 } from 'lucide-react';

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

interface DatabaseListProps {
  onDatabaseSelect: (database: Database) => void;
  onLogout: () => void;
}

export function DatabaseList({ onDatabaseSelect, onLogout }: DatabaseListProps) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const loadDatabases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const client = await getAzionClient();
      const { data, error: dbError } = await client.getDatabases();
      
      if (dbError) {
        setError(`Error loading databases: ${dbError.message}`);
        return;
      }

      if (data?.results) {
        setDatabases(data.results);
      }
    } catch (err) {
      setError('Unexpected error loading databases');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDatabase = async (databaseId: number, databaseName: string) => {
    try {
      setIsDeleting(databaseId);
      setError(null);

      const client = await getAzionClient();
      const { error: deleteError } = await client.deleteDatabase(databaseId);
      
      if (deleteError) {
        setError(`Erro ao deletar banco de dados: ${deleteError.message}`);
        return;
      }
      
      // Recarregar lista de bancos de dados
      await loadDatabases();
      
    } catch (err) {
      setError('Erro inesperado ao deletar banco de dados');
      console.error('Erro:', err);
    } finally {
      setIsDeleting(null);
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
          <p>Loading databases...</p>
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
            <p className="text-gray-600 mt-2">Manage your SQL databases</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadDatabases} 
              disabled={isLoading}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
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
                <p className="text-gray-500">No databases found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create a database using Azion CLI or Console
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
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {database.name}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isDeleting === database.id}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Database</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the database &quot;{database.name}&quot;? 
                            This action cannot be undone and all data will be lost.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDatabase(database.id, database.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardTitle>
                  <CardDescription>
                    ID: {database.id}
                  </CardDescription>
                </CardHeader>
                <CardContent 
                  onClick={() => {
                    if (['active', 'created'].includes(database.status)) {
                      onDatabaseSelect(database);
                    } else {
                      alert(`Database is not available. Status: ${database.status}`);
                    }
                  }}
                >
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Client ID: {database.client_id}</p>
                    <p>Status: <span className={`font-medium ${
                      ['active', 'created'].includes(database.status) ? 'text-orange-600' : 
                      database.status === 'deletion_failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {database.status}
                    </span></p>
                    <p>Created: {new Date(database.created_at).toLocaleDateString('en-US')}</p>
                    <p>Updated: {new Date(database.updated_at).toLocaleDateString('en-US')}</p>
                  </div>
                  {!['active', 'created'].includes(database.status) && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      ⚠️ Database is not active. Status: {database.status}
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