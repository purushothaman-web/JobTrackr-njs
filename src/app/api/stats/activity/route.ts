import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const startStr = req.nextUrl.searchParams.get('start');
    const endStr = req.nextUrl.searchParams.get('end');
    
    // Default to last 365 days if no range provided
    const end = endStr ? new Date(endStr) : new Date();
    const start = startStr ? new Date(startStr) : new Date(new Date().setDate(end.getDate() - 365));

    const jobs = await prisma.job.findMany({
      where: {
        userId: user.id,
        createdAt: {
            gte: start,
            lte: end
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by date (YYYY-MM-DD)
    const activity: Record<string, number> = {};
    
    jobs.forEach((job: any) => {
        const date = job.createdAt.toISOString().split('T')[0];
        activity[date] = (activity[date] || 0) + 1;
    });

    return NextResponse.json({ success: true, data: activity });

  } catch (error: any) {
    console.error('Error fetching activity stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
