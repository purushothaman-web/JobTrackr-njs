import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

const sanitizeText = (value: string) =>
  sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const rawName = typeof body.name === 'string' ? body.name : '';
    const rawEmail = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';

    const name = rawName ? sanitizeText(rawName) : '';
    const email = rawEmail ? rawEmail.trim().toLowerCase() : '';

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!name && !email && !password) {
      return NextResponse.json({ success: false, error: 'No fields provided for update' }, { status: 400 });
    }

    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 400 });
      }
    }

    if (name && name !== user.name) {
      const existingName = await prisma.user.findUnique({ where: { name } });
      if (existingName) {
        return NextResponse.json({ success: false, error: 'Name already in use' }, { status: 400 });
      }
    }

    let hashedPassword: string | undefined;
    if (password) {
      if (!user.password) {
        return NextResponse.json(
          { success: false, error: 'Password update is not available for this account' },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password required to change password' },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
      }

      const isSameAsOld = await bcrypt.compare(password, user.password);
      if (isSameAsOld) {
        return NextResponse.json({ success: false, error: 'New password cannot be the same as the current password' }, { status: 400 });
      }

      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
