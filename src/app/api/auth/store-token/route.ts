import { NextResponse } from 'next/server';
import { validateToken } from '@/lib/crypto-utils';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Valida o token fazendo uma chamada de teste
    const isValid = await validateToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao validar token:', error);
    return NextResponse.json(
      { error: 'Erro ao validar token' },
      { status: 500 }
    );
  }
} 