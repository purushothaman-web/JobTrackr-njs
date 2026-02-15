import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/utils/email';
import { enforceRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, {
      key: 'auth:forgot-password',
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'If an account with that email exists, you will receive a password reset link shortly.',
          },
        },
        { status: 200 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires,
      },
    });

    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetUrl = `${appUrl}/reset-password/${rawToken}`;
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333;">Password reset request</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Click the button below:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" style="background-color: #1D4ED8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        </p>
        <p>This link expires in 1 hour.</p>
      </div>
    `;

    await sendEmail(email, 'Password Reset Request', message);

    return NextResponse.json(
      {
        success: true,
        data: { message: 'If an account with that email exists, you will receive a password reset link shortly.' },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
