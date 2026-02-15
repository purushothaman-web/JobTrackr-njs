import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const totalJobs = await prisma.job.count({ where: { userId: user.id } });
    const statusCounts = await prisma.job.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { _all: true }
    });
    
    const stats: Record<string, number> = {};
    statusCounts.forEach((item) => {
      stats[item.status] = item._count._all;
    });

    return NextResponse.json({ success: true, data: { totalJobs, stats } });

  } catch (error: any) {
    console.error('get job stats error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
