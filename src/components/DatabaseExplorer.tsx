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
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Trash2, Table as TableIcon, Eye, Plus, Check, X } from 'lucide-react';

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
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [isInserting, setIsInserting] = useState(false);
  const [showNewRow, setShowNewRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setError(null);

      try {
        const client = await getAzionClient();
        
        // Use getTables directly
        const { data, error: tablesError } = await client.getTables(database.name);

        if (tablesError) {
          console.error('Error loading tables:', tablesError);
          setError(`Error loading tables: ${tablesError.message}`);
          return;
        }

        const results = data?.results?.[0]?.rows || [];
        
        // Extract table names
        setTables(results.map((row: any) => ({ 
          name: row.name || row.schema || row[1] || row[0] 
        })).filter(table => table.name));
        
      } catch (clientError: any) {
        console.error('Client error:', clientError);
        if (clientError.message.includes('Cliente Azion não configurado')) {
          setError('Client not configured. Try logging out and logging in again.');
        } else {
          throw clientError;
        }
      }
    } catch (err: any) {
      console.error('General error:', err);
      setError(`Unexpected error: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setIsLoadingData(true);
      setError(null);

      const client = await getAzionClient();

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

      const client = await getAzionClient();

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

  const insertRecord = async () => {
    if (!selectedTable || !tableData) return;

    try {
      setIsInserting(true);
      setError(null);

      const client = await getAzionClient();

      // Construir query INSERT
      const columns = Object.keys(newRowData).filter(key => newRowData[key] !== '');
      const values = columns.map(col => `'${newRowData[col].replace(/'/g, "''")}'`); // Escape aspas simples
      
      const insertQuery = `INSERT INTO "${selectedTable}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${values.join(', ')})`;

      const { error: executeError } = await client.execute(database.name, [insertQuery]);

      if (executeError) {
        setError(`Erro ao inserir registro: ${executeError.message}`);
        return;
      }

      // Recarregar dados da tabela
      await loadTableData(selectedTable);
      
      // Fechar modal e limpar dados
      setShowNewRow(false);
      setNewRowData({});
      
    } catch (err) {
      setError('Erro inesperado ao inserir registro');
      console.error('Erro:', err);
    } finally {
      setIsInserting(false);
    }
  };

  const openNewRowModal = () => {
    if (!tableData) return;
    
    // Inicializar dados do formulário com campos vazios
    const initialData: Record<string, string> = {};
    tableData.columns.forEach(column => {
      initialData[column] = '';
    });
    setNewRowData(initialData);
    setShowNewRow(true);
  };

  const startEdit = (rowIndex: number, rowData: Record<string, any>) => {
    setEditingRow(rowIndex);
    setEditData({ ...rowData });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const saveEdit = async (rowIndex: number, originalRow: Record<string, any>) => {
    if (!selectedTable || !tableData) return;

    try {
      setIsInserting(true);
      setError(null);

      const client = await getAzionClient();

      // Build UPDATE query - need to identify which fields changed and construct WHERE clause
      const changedFields = Object.keys(editData).filter(
        key => editData[key] !== originalRow[key]
      );

      if (changedFields.length === 0) {
        cancelEdit();
        return;
      }

      // Create SET clause
      const setClause = changedFields
        .map(field => `"${field}" = '${editData[field].replace(/'/g, "''")}'`)
        .join(', ');

      // Create WHERE clause using all original values
      const whereClause = Object.keys(originalRow)
        .map(key => {
          const value = originalRow[key];
          if (value === null || value === undefined) {
            return `"${key}" IS NULL`;
          }
          return `"${key}" = '${String(value).replace(/'/g, "''")}'`;
        })
        .join(' AND ');

      const updateQuery = `UPDATE "${selectedTable}" SET ${setClause} WHERE ${whereClause}`;

      const { error: executeError } = await client.execute(database.name, [updateQuery]);

      if (executeError) {
        setError(`Error updating record: ${executeError.message}`);
        return;
      }

      // Reload table data
      await loadTableData(selectedTable);
      
      // Clear editing state
      setEditingRow(null);
      setEditData({});
      
    } catch (err) {
      setError('Unexpected error updating record');
      console.error('Error:', err);
    } finally {
      setIsInserting(false);
    }
  };

  const addNewRow = () => {
    if (!tableData) return;
    
    // Initialize empty row data
    const initialData: Record<string, string> = {};
    tableData.columns.forEach(column => {
      initialData[column] = '';
    });
    setNewRowData(initialData);
    setShowNewRow(true);
  };

  const saveNewRow = async () => {
    if (!selectedTable || !tableData) return;

    try {
      setIsInserting(true);
      setError(null);

      const client = await getAzionClient();

      // Build INSERT query
      const columns = Object.keys(newRowData).filter(key => newRowData[key] !== '');
      const values = columns.map(col => `'${newRowData[col].replace(/'/g, "''")}'`);
      
      const insertQuery = `INSERT INTO "${selectedTable}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${values.join(', ')})`;

      const { error: executeError } = await client.execute(database.name, [insertQuery]);

      if (executeError) {
        setError(`Error inserting record: ${executeError.message}`);
        return;
      }

      // Reload table data
      await loadTableData(selectedTable);
      
      // Clear new row state
      setShowNewRow(false);
      setNewRowData({});
      
    } catch (err) {
      setError('Unexpected error inserting record');
      console.error('Error:', err);
    } finally {
      setIsInserting(false);
    }
  };

  const cancelNewRow = () => {
    setShowNewRow(false);
    setNewRowData({});
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
          <p>Loading tables...</p>
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
                Back
              </Button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-semibold text-gray-900">{database.name}</h1>
                <p className="text-sm text-gray-500 mt-1">Explore tables and data</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={loadTables} 
              disabled={isLoading}
              className="h-10 px-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border border-orange-200 hover:border-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
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
                  Tables
                  <span className="text-sm font-normal text-gray-500">({tables.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {tables.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <TableIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No tables found</p>
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
                        {tableData ? `${tableData.rows.length} records (max 100 shown)` : 'Loading...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {isLoadingData ? (
                    <div className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
                      <p className="text-gray-500">Loading data...</p>
                    </div>
                  ) : tableData ? (
                    <div>
                      {tableData.rows.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <TableIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Empty table</h4>
                          <p className="text-sm">No records found in this table</p>
                        </div>
                      ) : tableData.columns.length === 0 ? (
                        <div className="text-center py-12 text-yellow-600">
                          <TableIcon className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                          <h4 className="text-lg font-medium mb-2">Structure issue</h4>
                          <p className="text-sm">Data found, but couldn&apos;t extract columns</p>
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
                                <TableHead className="font-semibold text-gray-900 border-b-2 border-gray-200 w-20">
                                  Actions
                                </TableHead>
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
                                      {editingRow === index ? (
                                        <Input
                                          value={editData[column] || ''}
                                          onChange={(e) => setEditData(prev => ({
                                            ...prev,
                                            [column]: e.target.value
                                          }))}
                                          disabled={isInserting}
                                          className="h-8"
                                        />
                                      ) : (
                                        <div 
                                          className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                          onClick={() => startEdit(index, row)}
                                        >
                                          {row[column] !== null && row[column] !== undefined 
                                            ? <span className="text-gray-900">{String(row[column])}</span>
                                            : <span className="text-gray-400 italic">NULL</span>
                                          }
                                        </div>
                                      )}
                                    </TableCell>
                                  ))}
                                  <TableCell className="border-b border-gray-100">
                                    {editingRow === index ? (
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => saveEdit(index, row)}
                                          disabled={isInserting}
                                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={cancelEdit}
                                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
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
                                            <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this record? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => {/* TODO: implement delete */}}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {/* New Row */}
                              {showNewRow && (
                                <TableRow className="bg-blue-50 border-l-2 border-orange-500">
                                  {tableData.columns.map((column) => (
                                    <TableCell key={column} className="border-b border-gray-100">
                                      <Input
                                        placeholder={`Enter ${column}`}
                                        value={newRowData[column] || ''}
                                        onChange={(e) => setNewRowData(prev => ({
                                          ...prev,
                                          [column]: e.target.value
                                        }))}
                                        disabled={isInserting}
                                        className="h-8"
                                      />
                                    </TableCell>
                                  ))}
                                  <TableCell className="border-b border-gray-100">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={saveNewRow}
                                        disabled={isInserting || Object.values(newRowData).every(val => val === '')}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={cancelNewRow}
                                        className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                          
                          {/* Add Row Button */}
                          {!showNewRow && (
                            <div className="mt-4 flex justify-start">
                              <Button
                                onClick={addNewRow}
                                variant="outline"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add row
                              </Button>
                            </div>
                          )}
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
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Select a table</h4>
                  <p className="text-sm">Choose a table from the sidebar to view its data</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}