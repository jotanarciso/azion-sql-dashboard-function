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

    // Buscar database pelo nome (assumindo que id é o nome)
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

    return NextResponse.json({
      id: dbData.id,
      name: dbData.name,
      clientId: dbData.clientId,
      createdAt: dbData.createdAt,
      updatedAt: dbData.updatedAt,
      status: dbData.status,
    });

  } catch (error) {
    console.error('Erro ao buscar database:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 