import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

const validateId = (id: string) => {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
};

const normalizeText = (value: string) => value.trim();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const companyId = validateId(idParam);
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Invalid company ID' }, { status: 400 });
    }

    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
      include: {
        jobs: {
          select: { id: true, position: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error('Get company error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const companyId = validateId(idParam);
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Invalid company ID' }, { status: 400 });
    }

    const existingCompany = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
    });
    if (!existingCompany) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
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

    const duplicate = await prisma.company.findFirst({
      where: {
        userId: user.id,
        name,
        id: { not: companyId },
      },
    });
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'Another company with this name already exists' }, { status: 400 });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        website,
        industry,
        location,
        notes,
        jobs: {
          updateMany: {
            where: {},
            data: { company: name },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedCompany });
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const companyId = validateId(idParam);
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Invalid company ID' }, { status: 400 });
    }

    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: user.id },
      include: { _count: { select: { jobs: true } } },
    });
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company._count.jobs > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete company while jobs are linked to it' },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id: companyId } });
    return NextResponse.json({ success: true, data: { message: 'Company deleted successfully' } });
  } catch (error: any) {
    console.error('Delete company error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
