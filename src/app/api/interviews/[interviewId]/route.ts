import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const validateId = (id: string) => {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
};

const normalizeText = (value: string) => value.trim();

export async function GET(req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId: idParam } = await params;
    const interviewId = validateId(idParam);
    if (!interviewId) {
      return NextResponse.json({ success: false, error: 'Invalid interview ID' }, { status: 400 });
    }

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      include: {
        job: {
          select: { id: true, position: true, company: true, status: true },
        },
      },
    });
    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    console.error('Get interview error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId: idParam } = await params;
    const interviewId = validateId(idParam);
    if (!interviewId) {
      return NextResponse.json({ success: false, error: 'Invalid interview ID' }, { status: 400 });
    }

    const existingInterview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      include: { job: { select: { id: true, position: true, company: true } } },
    });
    if (!existingInterview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    const body = await req.json();
    const scheduledAtRaw = typeof body.scheduledAt === 'string' ? body.scheduledAt : null;
    const mode = typeof body.mode === 'string' ? normalizeText(body.mode) : null;
    const round = typeof body.round === 'string' ? normalizeText(body.round) : null;
    const status = typeof body.status === 'string' ? normalizeText(body.status).toLowerCase() : null;
    const notes = typeof body.notes === 'string' ? normalizeText(body.notes) : null;

    let scheduledAt: Date | undefined;
    if (scheduledAtRaw) {
      const parsed = new Date(scheduledAtRaw);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid scheduledAt value' }, { status: 400 });
      }
      scheduledAt = parsed;
    }

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        ...(scheduledAt ? { scheduledAt } : {}),
        ...(mode !== null ? { mode } : {}),
        ...(round !== null ? { round } : {}),
        ...(status !== null ? { status } : {}),
        ...(notes !== null ? { notes } : {}),
      },
    });

    await logActivity({
      userId: user.id,
      jobId: existingInterview.jobId,
      type: 'interview_updated',
      description: `Interview updated for ${existingInterview.job.position} at ${existingInterview.job.company}`,
      metadata: {
        interviewId: updatedInterview.id,
        oldStatus: existingInterview.status,
        newStatus: updatedInterview.status,
      },
    });

    return NextResponse.json({ success: true, data: updatedInterview });
  } catch (error: any) {
    console.error('Update interview error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ interviewId: string }> }) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId: idParam } = await params;
    const interviewId = validateId(idParam);
    if (!interviewId) {
      return NextResponse.json({ success: false, error: 'Invalid interview ID' }, { status: 400 });
    }

    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      include: { job: { select: { id: true, position: true, company: true } } },
    });
    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    await prisma.interview.delete({ where: { id: interviewId } });

    await logActivity({
      userId: user.id,
      jobId: interview.jobId,
      type: 'interview_deleted',
      description: `Interview removed for ${interview.job.position} at ${interview.job.company}`,
      metadata: { interviewId },
    });

    return NextResponse.json({ success: true, data: { message: 'Interview deleted successfully' } });
  } catch (error: any) {
    console.error('Delete interview error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
