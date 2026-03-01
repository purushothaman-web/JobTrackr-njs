import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '@/lib/db';
import generateToken from '@/lib/utils/jwtUtils';
import { sendEmail } from '@/lib/utils/email';
import { enforceRateLimit } from '@/lib/rateLimit';

const isStrongPassword = (password: string) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

const sanitizeText = (value: string) =>
  sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });

export async function POST(req: NextRequest) {
  try {
    const rateLimited = enforceRateLimit(req, {
      key: 'auth:register',
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const rawName = typeof body.name === 'string' ? body.name : '';
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const name = sanitizeText(rawName);
    const email = rawEmail.trim().toLowerCase();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email or name already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerificationToken,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    const appUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const verificationUrl = `${appUrl}/verify-email/${emailVerificationToken}`;
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

    await sendEmail(user.email, 'Email Verification', message);

    const token = generateToken(user);
    const response = NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          token,
          emailVerified: user.emailVerified,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
