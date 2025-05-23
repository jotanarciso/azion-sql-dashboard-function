import { createClient } from 'azion/sql';
import type { AzionSQLClient } from 'azion/sql';

interface Database {
  id: number;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface DatabasesResponse {
  databases: Database[];
  count: number;
}

interface TableInfo {
  name: string;
}

interface QueryResult {
  rows: Record<string, any>[];
  statement?: string;
}

class AzionClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getDatabases(): Promise<{ data?: DatabasesResponse; error?: { message: string } }> {
    try {
      const response = await fetch('/api/azion/databases', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: { message: `Erro de rede: ${error}` } };
    }
  }

  async getTables(databaseName: string): Promise<{ data?: { results: QueryResult[] }; error?: { message: string } }> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseName}/tables`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: { message: `Erro de rede: ${error}` } };
    }
  }

  async query(databaseName: string, statements: string[]): Promise<{ data?: { results: QueryResult[] }; error?: { message: string } }> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseName}/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ statements }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: { message: `Erro de rede: ${error}` } };
    }
  }

  async execute(databaseName: string, statements: string[]): Promise<{ data?: { results: QueryResult[] }; error?: { message: string } }> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseName}/query`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ statements }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: { message: `Erro de rede: ${error}` } };
    }
  }
}

let azionClient: AzionClient | null = null;

export function configureAzionClient(token: string) {
  console.log('Configurando cliente Azion com token:', token.substring(0, 10) + '...');
  azionClient = new AzionClient(token);
}

export function getAzionClient(): AzionClient {
  if (!azionClient) {
    console.error('Cliente Azion não configurado!');
    throw new Error('Cliente Azion não configurado. Chame configureAzionClient primeiro.');
  }
  console.log('Cliente Azion obtido com sucesso');
  return azionClient;
}

export function clearAzionClient() {
  azionClient = null;
} 