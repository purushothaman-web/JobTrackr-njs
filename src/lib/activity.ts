import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

type LogActivityInput = {
  userId: number;
  jobId: number;
  type: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export const logActivity = async (input: LogActivityInput) => {
  try {
    await prisma.activity.create({
      data: {
        userId: input.userId,
        jobId: input.jobId,
        type: input.type,
        description: input.description,
        fromValue: input.fromValue ?? null,
        toValue: input.toValue ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
