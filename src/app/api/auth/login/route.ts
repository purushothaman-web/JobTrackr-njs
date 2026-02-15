import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '@/lib/db';
import generateToken from '@/lib/utils/jwtUtils';
import { enforceRateLimit } from '@/lib/rateLimit';

const sanitizeText = (value: string) =>
  sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, {
      key: 'auth:login',
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const rawLogin = typeof body.login === 'string' ? body.login : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const login = sanitizeText(rawLogin);
    if (!login || !password) {
      return NextResponse.json({ success: false, error: 'Missing login or password' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login.toLowerCase() }, { name: login }],
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          token,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
