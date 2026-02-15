import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const validateId = (id: string) => {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
};

const normalizeStatus = (value: string) => value.trim().toLowerCase();
const normalizeText = (value: string) => value.trim();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const jobId = validateId(idParam);
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        companyRef: { select: { id: true, name: true } },
        interviews: { orderBy: { scheduledAt: 'asc' } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized access to this job' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    console.error('Get job by id error:', error);
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
    const jobId = validateId(idParam);
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
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

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (existingJob.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    let resolvedCompanyId: number | null = null;
    let companyName = inputCompany;

    if (companyId) {
      const company = await prisma.company.findFirst({ where: { id: companyId, userId: user.id } });
      if (!company) {
        return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
      }
      resolvedCompanyId = company.id;
      companyName = company.name;
    } else {
      const company = await prisma.company.findFirst({ where: { userId: user.id, name: companyName } });
      if (company) {
        resolvedCompanyId = company.id;
        companyName = company.name;
      }
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        position,
        company: companyName,
        companyId: resolvedCompanyId,
        status,
        location,
        notes,
      },
      include: {
        companyRef: { select: { id: true, name: true } },
      },
    });

    if (existingJob.status !== updatedJob.status) {
      await logActivity({
        userId: user.id,
        jobId: updatedJob.id,
        type: 'job_status_changed',
        description: `Job status changed from ${existingJob.status} to ${updatedJob.status}`,
        fromValue: existingJob.status,
        toValue: updatedJob.status,
      });
    } else {
      await logActivity({
        userId: user.id,
        jobId: updatedJob.id,
        type: 'job_updated',
        description: `Updated job details for ${updatedJob.position} at ${updatedJob.company}`,
      });
    }

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error: any) {
    console.error('Update job error:', error);
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
    const jobId = validateId(idParam);
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (existingJob.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await logActivity({
      userId: user.id,
      jobId,
      type: 'job_deleted',
      description: `Deleted job application for ${existingJob.position} at ${existingJob.company}`,
    });

    await prisma.job.delete({ where: { id: jobId } });

    return NextResponse.json({ success: true, data: { message: 'Job deleted successfully' } });
  } catch (error: any) {
    console.error('Delete job error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
