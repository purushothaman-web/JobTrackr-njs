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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333;">Verify your email address</h2>
        <p>Hello,</p>
        <p>Please verify your email by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </p>
      </div>
    `;

    await sendEmail(email, 'Email Verification', message);
    return NextResponse.json({ success: true, data: { message: 'Verification email resent' } }, { status: 200 });
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
