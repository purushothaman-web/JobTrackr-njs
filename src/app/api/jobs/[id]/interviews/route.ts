import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

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
    const jobId = validateId(idParam);
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const interviews = await prisma.interview.findMany({
      where: { jobId, userId: user.id },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: interviews });
  } catch (error: any) {
    console.error('Get interviews error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const jobId = validateId(idParam);
    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Invalid job ID' }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await req.json();
    const scheduledAtRaw = typeof body.scheduledAt === 'string' ? body.scheduledAt : '';
    const mode = typeof body.mode === 'string' ? normalizeText(body.mode) : null;
    const round = typeof body.round === 'string' ? normalizeText(body.round) : null;
    const status = typeof body.status === 'string' ? normalizeText(body.status).toLowerCase() : 'scheduled';
    const notes = typeof body.notes === 'string' ? normalizeText(body.notes) : null;

    if (!scheduledAtRaw) {
      return NextResponse.json({ success: false, error: 'scheduledAt is required' }, { status: 400 });
    }

    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid scheduledAt value' }, { status: 400 });
    }

    const interview = await prisma.interview.create({
      data: {
        jobId,
        userId: user.id,
        scheduledAt,
        mode,
        round,
        status,
        notes,
      },
    });

    await logActivity({
      userId: user.id,
      jobId,
      type: 'interview_created',
      description: `Interview scheduled for ${job.position} at ${job.company}`,
      toValue: scheduledAt.toISOString(),
      metadata: {
        interviewId: interview.id,
        interviewStatus: interview.status,
      },
    });

    return NextResponse.json({ success: true, data: interview }, { status: 201 });
  } catch (error: any) {
    console.error('Create interview error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
