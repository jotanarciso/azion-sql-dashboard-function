'use client';

import { useState, useEffect } from 'react';
import { getAzionClient } from '@/lib/azion-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { ArrowLeft, RefreshCw, Trash2, Table as TableIcon, Eye } from 'lucide-react';

interface Database {
  id: number;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface DatabaseExplorerProps {
  database: Database;
  onBack: () => void;
}

interface TableInfo {
  name: string;
}

interface TableData {
  columns: string[];
  rows: Record<string, any>[];
}

export function DatabaseExplorer({ database, onBack }: DatabaseExplorerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setError(null);

      try {
        const client = getAzionClient();
        
        console.log('Carregando tabelas para banco:', database.name);
        
        // Usar getTables diretamente
        const { data, error: tablesError } = await client.getTables(database.name);

        console.log('Resposta do getTables:', data);
        console.log('Erro do getTables:', tablesError);

        if (tablesError) {
          console.error('Erro ao carregar tabelas:', tablesError);
          setError(`Erro ao carregar tabelas: ${tablesError.message}`);
          return;
        }

        const results = data?.results?.[0]?.rows || [];
        console.log('Resultados extraídos:', results);
        console.log('Número de tabelas encontradas:', results.length);
        
        // Extrair nomes das tabelas
        setTables(results.map((row: any) => ({ 
          name: row.name || row.schema || row[1] || row[0] 
        })).filter(table => table.name));
        
      } catch (clientError: any) {
        console.error('Erro no cliente:', clientError);
        if (clientError.message.includes('Cliente Azion não configurado')) {
          setError('Cliente não configurado. Tente fazer logout e login novamente.');
        } else {
          throw clientError;
        }
      }
    } catch (err: any) {
      console.error('Erro geral:', err);
      setError(`Erro inesperado: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setIsLoadingData(true);
      setError(null);

      const client = getAzionClient();

      // Buscar dados da tabela
      const { data, error: queryError } = await client.query(database.name, [
        `SELECT * FROM "${tableName}" LIMIT 100`
      ]);

      if (queryError) {
        setError(`Erro ao carregar dados da tabela: ${queryError.message}`);
        return;
      }

      const results = data?.results?.[0];
      
      if (results && results.rows) {
        const rows = results.rows;
        let columns: string[] = [];
        
        if (rows.length > 0) {
          // Normalizar objeto para JavaScript padrão e extrair colunas
          try {
            const normalizedRow = JSON.parse(JSON.stringify(rows[0]));
            columns = Object.keys(normalizedRow);
          } catch (e) {
            // Fallback: tentar métodos alternativos
            columns = Object.getOwnPropertyNames(rows[0]);
          }
        }
        
        setTableData({
          columns,
          rows
        });
      } else {
        setTableData({
          columns: [],
          rows: []
        });
      }
    } catch (err) {
      setError('Erro inesperado ao carregar dados da tabela');
      console.error('Erro:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const deleteTable = async (tableName: string) => {
    try {
      setError(null);

      const client = getAzionClient();

      const { error: executeError } = await client.execute(database.name, [
        `DROP TABLE IF EXISTS "${tableName}"`
      ]);

      if (executeError) {
        setError(`Erro ao deletar tabela: ${executeError.message}`);
        return;
      }

      // Recarregar lista de tabelas
      await loadTables();
      
      // Se a tabela deletada estava selecionada, limpar seleção
      if (selectedTable === tableName) {
        setSelectedTable(null);
        setTableData(null);
      }
    } catch (err) {
      setError('Erro inesperado ao deletar tabela');
      console.error('Erro:', err);
    }
  };

  useEffect(() => {
    loadTables();
  }, [database.name]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando tabelas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Premium */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="h-10 px-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-semibold text-gray-900">{database.name}</h1>
                <p className="text-sm text-gray-500 mt-1">Explorar tabelas e dados</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={loadTables} 
              disabled={isLoading}
              className="h-10 px-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Lista de Tabelas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-orange-600" />
                  Tabelas
                  <span className="text-sm font-normal text-gray-500">({tables.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {tables.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <TableIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Nenhuma tabela encontrada</p>
                  </div>
                ) : (
                  tables.map((table) => (
                    <div
                      key={table.name}
                      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                        selectedTable === table.name ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                      }`}
                    >
                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                        onClick={() => setSelectedTable(table.name)}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          selectedTable === table.name ? 'bg-orange-500' : 'bg-gray-300'
                        }`} />
                        <span className={`font-medium text-sm ${
                          selectedTable === table.name ? 'text-orange-900' : 'text-gray-700'
                        }`}>
                          {table.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTable(table.name)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar Tabela</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar a tabela &quot;{table.name}&quot;? 
                                Esta ação não pode ser desfeita e todos os dados serão perdidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTable(table.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dados da Tabela */}
          <div className="lg:col-span-4">
            {selectedTable ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedTable}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {tableData ? `${tableData.rows.length} registros (máximo 100 exibidos)` : 'Carregando...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Ativo</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {isLoadingData ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                      <p className="text-gray-500">Carregando dados...</p>
                    </div>
                  ) : tableData ? (
                    <div>
                      {tableData.rows.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <TableIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Tabela vazia</h4>
                          <p className="text-sm">Nenhum registro encontrado nesta tabela</p>
                        </div>
                      ) : tableData.columns.length === 0 ? (
                        <div className="text-center py-12 text-yellow-600">
                          <TableIcon className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                          <h4 className="text-lg font-medium mb-2">Problema na estrutura</h4>
                          <p className="text-sm">Dados encontrados, mas não foi possível extrair as colunas</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                {tableData.columns.map((column) => (
                                  <TableHead key={column} className="font-semibold text-gray-900 border-b-2 border-gray-200">
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tableData.rows.map((row, index) => (
                                <TableRow 
                                  key={index} 
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  {tableData.columns.map((column) => (
                                    <TableCell key={column} className="border-b border-gray-100 text-gray-900">
                                      {row[column] !== null && row[column] !== undefined 
                                        ? <span className="text-gray-900">{String(row[column])}</span>
                                        : <span className="text-gray-400 italic">NULL</span>
                                      }
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-12 text-center text-gray-500">
                  <TableIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Selecione uma tabela</h4>
                  <p className="text-sm">Escolha uma tabela da lista ao lado para visualizar seus dados</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 