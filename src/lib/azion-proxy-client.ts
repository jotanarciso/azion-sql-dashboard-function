interface Database {
  id: number;
  name: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

interface QueryResult {
  rows: Record<string, any>[];
  statement?: string;
}

interface QueryResponse {
  data?: {
    toObject: () => {
      results: QueryResult[];
    } | null;
  };
  error?: {
    message: string;
  };
}

interface DatabaseResponse {
  data?: Database;
  error?: {
    message: string;
  };
}

interface DatabasesResponse {
  data?: {
    databases: Database[];
    count: number;
  };
  error?: {
    message: string;
  };
}

class AzionProxyClient {
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

  async getDatabases(): Promise<DatabasesResponse> {
    try {
      const response = await fetch('/api/azion/databases', {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      
      // Converter formato da API para o formato esperado
      const databases = data.results?.map((db: any) => ({
        id: db.id,
        name: db.name,
        clientId: db.client_id,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        status: db.status,
      })) || [];

      return {
        data: {
          databases,
          count: data.count || 0,
        },
      };
    } catch (error) {
      return {
        error: {
          message: `Erro de rede: ${error}`,
        },
      };
    }
  }

  async getDatabase(name: string): Promise<DatabaseResponse> {
    try {
      const response = await fetch(`/api/azion/databases?search=${encodeURIComponent(name)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      const database = data.results?.find((db: any) => db.name === name);

      if (!database) {
        return {
          error: {
            message: `Banco '${name}' não encontrado`,
          },
        };
      }

      return {
        data: {
          id: database.id,
          name: database.name,
          clientId: database.client_id,
          createdAt: database.created_at,
          updatedAt: database.updated_at,
          status: database.status,
        },
      };
    } catch (error) {
      return {
        error: {
          message: `Erro de rede: ${error}`,
        },
      };
    }
  }

  async query(databaseId: number, statements: string[]): Promise<QueryResponse> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseId}/query`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ statements }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();

      return {
        data: {
          toObject: () => {
            if (!data || !Array.isArray(data)) return null;
            
            return {
              results: data.map((result: any) => ({
                rows: result.results?.rows || [],
                statement: result.results?.statement,
              })),
            };
          },
        },
      };
    } catch (error) {
      return {
        error: {
          message: `Erro de rede: ${error}`,
        },
      };
    }
  }

  async execute(databaseId: number, statements: string[]): Promise<QueryResponse> {
    // Execute usa a mesma API que query na Azion
    return this.query(databaseId, statements);
  }

  async getTables(databaseId: number): Promise<QueryResponse> {
    try {
      const response = await fetch(`/api/azion/databases/${databaseId}/tables`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          error: {
            message: errorData.error || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();

      return {
        data: {
          toObject: () => {
            // Se for resposta da API específica /tables
            if (data && Array.isArray(data.results)) {
              return {
                results: [{
                  rows: data.results.map((table: any) => ({ name: table.name })),
                  statement: 'getTables',
                }],
              };
            }
            
            // Se for resposta de query PRAGMA table_list
            if (data && Array.isArray(data)) {
              return {
                results: data.map((result: any) => ({
                  rows: result.results?.rows || [],
                  statement: result.results?.statement,
                })),
              };
            }
            
            return null;
          },
        },
      };
    } catch (error) {
      return {
        error: {
          message: `Erro de rede: ${error}`,
        },
      };
    }
  }
}

let proxyClient: AzionProxyClient | null = null;

export function configureProxyClient(token: string) {
  console.log('Configurando cliente proxy com token:', token.substring(0, 10) + '...');
  proxyClient = new AzionProxyClient(token);
}

export function getProxyClient(): AzionProxyClient {
  if (!proxyClient) {
    console.error('Cliente proxy não configurado!');
    throw new Error('Cliente proxy não configurado. Chame configureProxyClient primeiro.');
  }
  console.log('Cliente proxy obtido com sucesso');
  return proxyClient;
}

export function clearProxyClient() {
  proxyClient = null;
} 