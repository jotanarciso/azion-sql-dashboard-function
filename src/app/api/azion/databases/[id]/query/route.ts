import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from 'azion/sql';

export async function POST(
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

    const body = await request.json();
    const { statements } = body;

    if (!statements || !Array.isArray(statements)) {
      return NextResponse.json(
        { error: 'Statements são obrigatórios' },
        { status: 400 }
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

    // Executar query
    const result = await dbData.query(statements);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Erro ao executar query' },
        { status: 500 }
      );
    }

    const results = result.data?.toObject();
    return NextResponse.json(results);

  } catch (error) {
    console.error('Erro ao executar query:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const { statements } = body;

    if (!statements || !Array.isArray(statements)) {
      return NextResponse.json(
        { error: 'Statements são obrigatórios' },
        { status: 400 }
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

    // Executar comando
    const result = await dbData.execute(statements);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Erro ao executar comando' },
        { status: 500 }
      );
    }

    const results = result.data?.toObject();
    return NextResponse.json(results);

  } catch (error) {
    console.error('Erro ao executar comando:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 