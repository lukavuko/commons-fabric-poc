import { NextRequest } from 'next/server';
import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase/server';

export type AuthUser = { id: string; email: string };

export type Context = {
  user: AuthUser | null;
  prisma: typeof prisma;
  requireAuth: () => AuthUser;
  requireCommunityRole: (communityId: string, allowedRoles: string[]) => Promise<AuthUser>;
};

export async function buildContext(req: NextRequest): Promise<Context> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  let user: AuthUser | null = null;

  if (token) {
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && supabaseUser?.email) {
      const dbUser = await prisma.user.upsert({
        where: { id: supabaseUser.id },
        update: { lastloginAt: new Date() },
        create: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          username: supabaseUser.user_metadata?.username ?? supabaseUser.email.split('@')[0],
        },
      });
      user = { id: dbUser.id, email: dbUser.email };
    }
  }

  const requireAuth = (): AuthUser => {
    if (!user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
    return user;
  };

  const requireCommunityRole = async (communityId: string, allowedRoles: string[]): Promise<AuthUser> => {
    const authedUser = requireAuth();
    const userRole = await prisma.userRole.findUnique({
      where: { userId_entityId: { userId: authedUser.id, entityId: communityId } },
      include: { role: true },
    });
    const roleName = userRole?.role.name.toUpperCase() ?? '';
    if (!allowedRoles.map(r => r.toUpperCase()).includes(roleName)) {
      throw new GraphQLError('Not authorized', { extensions: { code: 'FORBIDDEN' } });
    }
    return authedUser;
  };

  return { user, prisma, requireAuth, requireCommunityRole };
}
