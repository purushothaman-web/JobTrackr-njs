import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
}

export async function getUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}
