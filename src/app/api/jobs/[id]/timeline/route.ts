import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

const validateId = (id: string) => {
  const num = parseInt(id, 10);
  return Number.isNaN(num) ? null : num;
};

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

    const timeline = await prisma.activity.findMany({
      where: { jobId, userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: timeline });
  } catch (error: any) {
    console.error('Get timeline error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
