import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { sendEmail } from '@/lib/utils/email';

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({ where: { userId: user.id } });

    const recentJobs = await prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const counts = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    let totalApplications = 0;

    jobs.forEach((job: any) => {
      const statusLower = job.status.toLowerCase();
      if (counts.hasOwnProperty(statusLower)) {
          (counts as any)[statusLower]++;
      }
      totalApplications++;
    });

    const recentJobsHtml = recentJobs.map((job: any) => `
      <tr>
        <td><strong>${job.position}</strong> at ${job.company}</td>
        <td><span style="padding: 4px 8px; border-radius: 4px; background-color: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: bold; text-transform: uppercase;">${job.status}</span></td>
      </tr>
    `).join('');

    const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
    .email-container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    h2 { color: #2c3e50; margin-top: 0; }
    h3 { color: #475569; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .summary-table th, .summary-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
    .summary-table th { background-color: #f8fafc; color: #64748b; font-weight: 600; }
    .recent-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .footer { margin-top: 30px; font-size: 13px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="email-container">
    <h2>Hello ${user.name},</h2>
    <p>Here is your full job search report.</p>

    <h3>Summary</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Applied</td><td>${counts.applied}</td></tr>
        <tr><td>Interview</td><td>${counts.interview}</td></tr>
        <tr><td>Offer</td><td>${counts.offer}</td></tr>
        <tr><td>Rejected</td><td>${counts.rejected}</td></tr>
        <tr><td><strong>Total</strong></td><td><strong>${totalApplications}</strong></td></tr>
      </tbody>
    </table>

    <h3>Recent Activity</h3>
    <table class="recent-table" style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${recentJobsHtml}
      </tbody>
    </table>

    <p style="margin-top: 24px;">Keep going! Consistency is key.</p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} JobTrackr. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(user.email, 'Your JobTrackr Full Report', emailContent);
    return NextResponse.json({ success: true, data: { message: 'Full report sent successfully' } });

  } catch (error: any) {
    console.error('Error sending job summary email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
