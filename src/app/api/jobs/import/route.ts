import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

type ImportRow = {
  position?: string;
  company?: string;
  status?: string;
  location?: string;
  notes?: string;
  companyId?: number;
};

const normalize = (value: string) => value.trim();
const normalizeStatus = (value: string) => value.trim().toLowerCase();
const makeDedupeKey = (position: string, company: string) =>
  `${position.trim().toLowerCase()}::${company.trim().toLowerCase()}`;

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : null;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'rows array is required' }, { status: 400 });
    }

    const existingJobs = await prisma.job.findMany({
      where: { userId: user.id },
      select: { id: true, position: true, company: true },
    });

    const existingKeys = new Set(existingJobs.map((job) => makeDedupeKey(job.position, job.company)));
    const batchKeys = new Set<string>();

    let imported = 0;
    let skippedDuplicates = 0;
    let invalidRows = 0;

    for (const row of rows) {
      const position = typeof row.position === 'string' ? normalize(row.position) : '';
      const status = typeof row.status === 'string' && row.status.trim() ? normalizeStatus(row.status) : 'applied';
      const location = typeof row.location === 'string' ? normalize(row.location) : null;
      const notes = typeof row.notes === 'string' ? normalize(row.notes) : null;
      const inputCompany = typeof row.company === 'string' ? normalize(row.company) : '';
      const inputCompanyId = typeof row.companyId === 'number' ? row.companyId : null;

      if (!position || (!inputCompany && !inputCompanyId)) {
        invalidRows += 1;
        continue;
      }

      let companyId: number | null = null;
      let companyName = inputCompany;

      if (inputCompanyId) {
        const company = await prisma.company.findFirst({
          where: { id: inputCompanyId, userId: user.id },
        });
        if (!company) {
          invalidRows += 1;
          continue;
        }
        companyId = company.id;
        companyName = company.name;
      } else {
        const company = await prisma.company.findFirst({
          where: { userId: user.id, name: companyName },
        });
        if (company) {
          companyId = company.id;
          companyName = company.name;
        }
      }

      const dedupeKey = makeDedupeKey(position, companyName);
      if (existingKeys.has(dedupeKey) || batchKeys.has(dedupeKey)) {
        skippedDuplicates += 1;
        continue;
      }

      const created = await prisma.job.create({
        data: {
          userId: user.id,
          position,
          company: companyName,
          companyId,
          status,
          location,
          notes,
        },
      });

      batchKeys.add(dedupeKey);
      imported += 1;

      await logActivity({
        userId: user.id,
        jobId: created.id,
        type: 'job_imported',
        description: `Imported job application for ${created.position} at ${created.company}`,
        toValue: created.status,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skippedDuplicates,
        invalidRows,
        totalRows: rows.length,
      },
    });
  } catch (error: any) {
    console.error('Import jobs error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
