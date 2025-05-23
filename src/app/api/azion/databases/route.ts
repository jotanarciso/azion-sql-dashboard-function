import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('Header Authorization recebido:', authHeader);

    const token = authHeader?.replace('Token ', '');
    console.log('Token extraído:', token ? `${token.substring(0, 10)}...` : 'null');

    if (!token) {
      console.log('Token não fornecido');
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    console.log('Fazendo requisição para API da Azion...');
    const response = await fetch('https://api.azion.com/v4/edge_sql/databases', {
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('Status da resposta da API Azion:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Erro da API Azion:', errorText);
      
      try {
        const error = JSON.parse(errorText);
        return NextResponse.json(
          { error: error.message || error.detail || 'Erro ao buscar bancos de dados' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `API Error (${response.status}): ${errorText}` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    console.log('Dados recebidos da API Azion:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
} 