import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { Parser } from 'json2csv';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: { userId: user.id },
      select: {
          id: true,
          position: true,
          company: true,
          status: true,
          location: true,
          notes: true,
          createdAt: true,

          // Let's check schema again.
      },
      orderBy: { createdAt: 'desc' } 
    });

    const fields = ['id', 'position', 'company', 'status', 'location', 'notes', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(jobs);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="jobs.csv"',
      },
    });

  } catch (error: any) {
    console.error('Export jobs error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
