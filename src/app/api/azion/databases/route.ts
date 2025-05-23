import { NextRequest, NextResponse } from 'next/server';
import { getDatabases } from 'azion/sql';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      );
    }

    // Configurar token do SDK
    process.env.AZION_TOKEN = authHeader.replace('Token ', '');

    const { data, error } = await getDatabases();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erro ao listar bancos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 