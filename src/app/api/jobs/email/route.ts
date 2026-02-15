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

    // Fetch user to get name (already have name in token usually, but good to be safe)
    // Actually user object from getUser has name.

    const jobs = await prisma.job.findMany({ where: { userId: user.id } });

    const counts = {
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    let totalApplications = 0;

    jobs.forEach(job => {
      const statusLower = job.status.toLowerCase();
      // Simple counting logic from controller
      if (counts.hasOwnProperty(statusLower)) {
          (counts as any)[statusLower]++;
      }
      totalApplications++;
    });

    const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 20px; color: #333; }
    .email-container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    h2 { color: #2c3e50; }
    .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .summary-table th, .summary-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    .summary-table th { background-color: #f0f0f0; color: #555; }
    .footer { margin-top: 30px; font-size: 13px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="email-container">
    <h2>Hello ${user.name},</h2>
    <p>Here is your weekly job application summary:</p>

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
        <tr><td>Total</td><td>${totalApplications}</td></tr>
      </tbody>
    </table>

    <p>Keep tracking and applying — you're doing great!</p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} JobTrackr. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail(user.email, 'Your Weekly Job Summary', emailContent);
    return NextResponse.json({ success: true, data: { message: 'Job summary email sent successfully' } });

  } catch (error: any) {
    console.error('Error sending job summary email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
