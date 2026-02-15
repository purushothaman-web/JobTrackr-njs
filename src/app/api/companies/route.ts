import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

const normalizeText = (value: string) => value.trim();

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get('search')?.trim();
    const where: any = { userId: user.id };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: companies });
  } catch (error: any) {
    console.error('Get companies error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? normalizeText(body.name) : '';
    const website = typeof body.website === 'string' ? normalizeText(body.website) : null;
    const industry = typeof body.industry === 'string' ? normalizeText(body.industry) : null;
    const location = typeof body.location === 'string' ? normalizeText(body.location) : null;
    const notes = typeof body.notes === 'string' ? normalizeText(body.notes) : null;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
    }

    const existing = await prisma.company.findFirst({
      where: { userId: user.id, name },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Company already exists' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        userId: user.id,
        name,
        website,
        industry,
        location,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
