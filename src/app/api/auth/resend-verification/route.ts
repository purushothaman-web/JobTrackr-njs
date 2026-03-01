import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/utils/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User with this email does not exist' }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: 'Email is already verified' }, { status: 400 });
    }

    const token = user.emailVerificationToken || crypto.randomBytes(32).toString('hex');
    if (!user.emailVerificationToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: token },
      });
    }

    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const verificationUrl = `${appUrl}/verify-email/${token}`;
    const message = `
      <div style="font-family: 'Courier New', monospace; max-width: 600px; margin: auto; padding: 30px; border: 2px solid #27272a; background-color: #0a0a0a; color: #fafafa;">
        <h2 style="font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 20px; font-size: 24px; color: #fafafa;">SYS_INIT<span style="color: #a3e635;">.</span></h2>
        <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 20px;">
          Identity Sync Sequence
        </p>
        <p style="font-size: 14px; margin-bottom: 20px; line-height: 1.5;">Subject identity unverified. Click the execution link below to synchronize your comms channel with the mainframe.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; font-size: 14px; color: #0a0a0a; background-color: #a3e635; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #a3e635;">
            [ SYNCHRONIZE ]
          </a>
        </div>
        <p style="font-size: 12px; color: #71717a; line-height: 1.5;">If this request is unrecognized, abort action and purge this transmission.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #27272a; font-size: 10px; color: #52525b; word-break: break-all;">
          MANUAL OVERRIDE LINK:<br/>
          <a href="${verificationUrl}" style="color: #a3e635; text-decoration: none;">${verificationUrl}</a>
        </div>
      </div>
    `;

    await sendEmail(email, 'Email Verification', message);
    return NextResponse.json({ success: true, data: { message: 'Verification email resent' } }, { status: 200 });
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
