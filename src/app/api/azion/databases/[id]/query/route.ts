import { NextRequest, NextResponse } from 'next/server';
import { useQuery as azionQuery, useExecute as azionExecute } from 'azion/sql';

export const runtime = 'edge';

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

    // Usar azionQuery para queries de leitura
    const { data, error } = await azionQuery(params.id, statements);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data) {
      const results = data.toObject();
      return NextResponse.json({
        results: results?.results || []
      });
    }

    return NextResponse.json({
      results: []
    });

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

    // Usar azionExecute para operações de escrita
    const { data, error } = await azionExecute(params.id, statements, { force: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data) {
      const results = data.toObject();
      return NextResponse.json({
        results: results?.results || []
      });
    }

    return NextResponse.json({
      results: []
    });

  } catch (error) {
    console.error('Erro ao executar comando:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 