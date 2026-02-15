import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const validateId = (id: string) => {
    const num = parseInt(id, 10);
    return isNaN(num) ? null : num;
};

// PATCH /api/jobs/[id]/status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { status } = body;

    if (!status) {
        return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    if (existingJob.userId !== user.id) {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status },
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
    }

    return NextResponse.json({ success: true, data: updatedJob });

  } catch (error: any) {
    console.error('update job status error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
