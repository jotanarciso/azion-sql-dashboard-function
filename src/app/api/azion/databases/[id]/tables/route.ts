import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from 'azion/sql';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar database pelo nome
    const { data: dbData, error } = await getDatabase(params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!dbData) {
      return NextResponse.json(
        { error: 'Database não encontrado' },
        { status: 404 }
      );
    }

    // Usar getTables do database
    const tables = await dbData.getTables();
    
    if (!tables) {
      return NextResponse.json(
        { error: 'Erro ao buscar tabelas' },
        { status: 500 }
      );
    }

    const results = tables.data?.toObject();
    return NextResponse.json(results);

  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 