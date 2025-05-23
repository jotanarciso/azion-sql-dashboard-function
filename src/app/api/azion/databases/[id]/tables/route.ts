import { NextRequest, NextResponse } from 'next/server';
import { useQuery as azionQuery } from 'azion/sql';

export const runtime = 'edge';

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

    // Usar azionQuery para listar tabelas
    const { data, error } = await azionQuery(params.id, [
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ]);

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
    console.error('Erro ao buscar tabelas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 