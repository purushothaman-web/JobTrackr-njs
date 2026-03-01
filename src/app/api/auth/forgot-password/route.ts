import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/utils/email';
import { enforceRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

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
      <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #27272a; background-color: #0a0a0a; color: #fafafa;">
        <h2 style="font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 20px; font-size: 24px; color: #fafafa;">SYS_OVERRIDE<span style="color: #a3e635;">.</span></h2>
        <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 20px;">
          Reset Synchronization Protocol
        </p>
        <p style="font-size: 14px; margin-bottom: 20px; line-height: 1.5;">A password reset sequence has been initiated for your coordinates. Execute the link below to confirm.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; color: #0a0a0a; background-color: #a3e635; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #a3e635;">
            [ RESET_CIPHER ]
          </a>
        </div>
        <p style="font-size: 12px; color: #a3e635; font-weight: bold; margin-bottom: 20px;">Link expires in 1 hour.</p>
        <p style="font-size: 12px; color: #71717a; line-height: 1.5;">If this request is unrecognized, your matrix is unharmed. Purge this transmission.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #27272a; font-size: 10px; color: #52525b; word-break: break-all;">
          MANUAL OVERRIDE LINK:<br/>
          <a href="${resetUrl}" style="color: #a3e635; text-decoration: none;">${resetUrl}</a>
        </div>
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
