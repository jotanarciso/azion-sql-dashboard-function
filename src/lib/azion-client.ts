import { decryptToken } from './crypto-utils';

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

interface DatabasesResponse {
  results: Database[];
  count: number;
}

interface QueryResult {
  rows: Record<string, any>[];
  statement?: string;
}

class AzionClient {
  private _token: string;

  constructor(token: string) {
    this._token = token;
  }

  get token(): string {
    return this._token;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this._token}`,
      'Content-Type': 'application/json',
    };
  }

  async getDatabases(): Promise<{ data?: DatabasesResponse; error?: { message: string } }> {
    try {
      console.log('Iniciando getDatabases...');
      const headers = this.getHeaders();
      console.log('Headers:', { ...headers, Authorization: headers.Authorization ? `${headers.Authorization.substring(0, 15)}...` : 'null' });
      
      const response = await fetch('/api/azion/databases', {
        method: 'GET',
        headers,
      });

      console.log('Resposta recebida:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Erro na resposta:', errorData);
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      console.log('Dados recebidos:', data);
      return { data };
    } catch (err: any) {
      console.error('Erro no getDatabases:', err);
      return { error: { message: `Erro de rede: ${err.message || err}` } };
    }
  }

  async deleteDatabase(databaseId: number): Promise<{ data?: any; error?: { message: string } }> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: { message: errorData.error || `HTTP ${response.status}` } };
      }

      const data = await response.json();
      return { data };
    } catch (err: any) {
      return { error: { message: `Erro de rede: ${err.message || err}` } };
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
    } catch (err: any) {
      return { error: { message: `Erro de rede: ${err.message || err}` } };
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
    } catch (err: any) {
      return { error: { message: `Erro de rede: ${err.message || err}` } };
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
    } catch (err: any) {
      return { error: { message: `Erro de rede: ${err.message || err}` } };
    }
  }
}

let azionClient: AzionClient | null = null;

export async function getAzionClient(): Promise<AzionClient> {
  const encryptedToken = localStorage.getItem('azion_token');
  console.log('Token criptografado lido do localStorage:', encryptedToken ? `${encryptedToken.substring(0, 10)}...` : 'null');
  
  if (!encryptedToken) {
    console.log('Token não encontrado no localStorage');
    azionClient = null;
    throw new Error('Cliente Azion não configurado. Token não encontrado.');
  }

  try {
    // Descriptografar o token
    const token = await decryptToken(encryptedToken);
    console.log('Token descriptografado:', token ? `${token.substring(0, 10)}...` : 'null');

    // Se não existe cliente ou o token mudou, criar novo cliente
    if (!azionClient || azionClient.token !== token) {
      console.log('Criando novo AzionClient...');
      azionClient = new AzionClient(token);
      console.log('AzionClient criado com sucesso');
    }
    
    return azionClient;
  } catch (error) {
    console.error('Erro ao descriptografar token:', error);
    throw new Error('Erro ao descriptografar token');
  }
}

export function clearAzionClient() {
  azionClient = null;
}