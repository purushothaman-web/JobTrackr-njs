import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'position', 'company', 'status']);

const normalizeStatus = (value: string) => value.trim().toLowerCase();
const normalizeText = (value: string) => value.trim();

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
      return NextResponse.json({ success: false, error: 'Invalid sort field' }, { status: 400 });
    }

    const whereClause: any = { userId: user.id };
    if (status) {
      whereClause.status = normalizeStatus(status);
    }
    if (search) {
      whereClause.OR = [
        { position: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { companyRef: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;
    const totalJobs = await prisma.job.count({ where: whereClause });

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        companyRef: {
          select: { id: true, name: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        page,
        limit,
        totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
        jobs,
      },
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
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
    const position = typeof body.position === 'string' ? normalizeText(body.position) : '';
    const status = typeof body.status === 'string' ? normalizeStatus(body.status) : '';
    const location = typeof body.location === 'string' ? normalizeText(body.location) : null;
    const notes = typeof body.notes === 'string' ? normalizeText(body.notes) : null;
    const inputCompany = typeof body.company === 'string' ? normalizeText(body.company) : '';
    const companyId = typeof body.companyId === 'number' ? body.companyId : null;

    if (!position || !status || (!inputCompany && !companyId)) {
      return NextResponse.json(
        { success: false, error: 'Please provide position, company (or companyId), and status' },
        { status: 400 }
      );
    }

    let resolvedCompanyId: number | null = null;
    let companyName = inputCompany;

    if (companyId) {
      const existingCompany = await prisma.company.findFirst({
        where: { id: companyId, userId: user.id },
      });
      if (!existingCompany) {
        return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
      }
      resolvedCompanyId = existingCompany.id;
      companyName = existingCompany.name;
    } else {
      const existingCompany = await prisma.company.findFirst({
        where: { userId: user.id, name: companyName },
      });
      if (existingCompany) {
        resolvedCompanyId = existingCompany.id;
        companyName = existingCompany.name;
      }
    }

    const job = await prisma.job.create({
      data: {
        position,
        company: companyName,
        companyId: resolvedCompanyId,
        status,
        location,
        notes,
        userId: user.id,
      },
      include: {
        companyRef: {
          select: { id: true, name: true },
        },
      },
    });

    await logActivity({
      userId: user.id,
      jobId: job.id,
      type: 'job_created',
      description: `Created job application for ${job.position} at ${job.company}`,
      toValue: job.status,
    });

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
