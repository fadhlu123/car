import crypto from 'crypto';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { DeviceContext } from '../../../utils/request.utils';
import { hashPassword } from '../../../utils/crypto.utils';
import { getUserModel } from '../../../models/user.model';
import { getAdminInviteModel } from '../../../models/admin.invite.model';
import { createAdminSession, revokeAllAdminSessions } from '../../auth/services/auth.session.service';
import { logEvent } from '../../auth/services/auth.audit.service';
import { sendAdminInviteEmail } from './team.notify.service';
import { hashToken } from '../../auth/services/auth.token.service';
import { AuthResult } from '../../auth/types/auth.types';

const logger = createLogger('admin-team');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const ERRORS = {
  ALREADY_ADMIN:        'This email already belongs to an admin account',
  PENDING_INVITE:       'A pending invite has already been sent to this email',
  INVITE_NOT_FOUND:     'Invite not found or has already been used',
  INVITE_EXPIRED:       'This invite has expired. Ask an owner to send a new one.',
  CANNOT_REMOVE_SELF:   'You cannot remove yourself from the admin team',
  CANNOT_REMOVE_OWNER:  'Owner accounts cannot be removed via this endpoint. Edit ADMIN_EMAILS in the server config.',
  STAFF_NOT_FOUND:      'Admin team member not found',
  PASSWORD_REQUIRED:    'Password is required when creating a new account',
  NAME_REQUIRED:        'First and last name are required when creating a new account',
} as const;

type Ctx = DeviceContext;

// ── Invite ────────────────────────────────────────────────────────────────────

export const inviteAdmin = async (
  email:    string,
  ownerId:  string,
  ownerEmail: string,
  ctx: Ctx
): Promise<void> => {
  const User   = await getUserModel();
  const Invite = await getAdminInviteModel();

  const normalised = email.toLowerCase().trim();
  const existing   = await User.findOne({ email: normalised });

  if (existing?.role === 'admin') {
    throw new AppError(ERRORS.ALREADY_ADMIN, 409);
  }

  const pendingInvite = await Invite.findOne({ email: normalised, status: 'pending' });
  if (pendingInvite && pendingInvite.expires_at > new Date()) {
    throw new AppError(ERRORS.PENDING_INVITE, 409);
  }

  // Generate a cryptographically random token and store only its hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  await Invite.create({
    email:      normalised,
    token_hash: hashToken(rawToken),
    invited_by: ownerId,
    expires_at: new Date(Date.now() + INVITE_TTL_MS),
  });

  try {
    await sendAdminInviteEmail(normalised, rawToken, ownerEmail);
  } catch (err: any) {
    logger.error('Failed to send admin invite email', { email: normalised, error: err?.message, stack: err?.stack });
  }

  await logEvent({ userId: ownerId, email: normalised, event: 'admin_invited', success: true, ...ctx });
  logger.info('Admin invite sent', { email: normalised, by: ownerId });
};

// ── Get invite info (public — for the invite acceptance UI) ───────────────────

export const getInviteInfo = async (rawToken: string) => {
  const Invite = await getAdminInviteModel();
  const User   = await getUserModel();

  const invite = await Invite.findOne({ token_hash: hashToken(rawToken), status: 'pending' });
  if (!invite || invite.expires_at < new Date()) {
    throw new AppError(ERRORS.INVITE_NOT_FOUND, 404);
  }

  const inviter = await User.findById(invite.invited_by)
    .select('profile.first_name profile.last_name email')
    .lean();

  const hasAccount = !!(await User.findOne({ email: invite.email }));

  return {
    email:      invite.email,
    invited_by: inviter
      ? { name: `${inviter.profile.first_name} ${inviter.profile.last_name}`.trim(), email: inviter.email }
      : null,
    has_account: hasAccount,
    expires_at:  invite.expires_at,
  };
};

// ── Accept invite ─────────────────────────────────────────────────────────────

interface AcceptPayload {
  rawToken:    string;
  password?:   string;
  first_name?: string;
  last_name?:  string;
  ctx: Ctx;
}

export const acceptInvite = async ({
  rawToken, password, first_name, last_name, ctx,
}: AcceptPayload): Promise<AuthResult> => {
  const Invite = await getAdminInviteModel();
  const User   = await getUserModel();

  const invite = await Invite.findOne({ token_hash: hashToken(rawToken), status: 'pending' });
  if (!invite || invite.expires_at < new Date()) {
    throw new AppError(ERRORS.INVITE_NOT_FOUND, 404);
  }

  let user = await User.findOne({ email: invite.email });

  if (user) {
    // Promote existing user to staff admin
    await User.findByIdAndUpdate(user._id, { role: 'admin', admin_role: 'staff' });
    user = await User.findById(user._id);
  } else {
    // New account — require name + password
    if (!password)   throw new AppError(ERRORS.PASSWORD_REQUIRED, 422);
    if (!first_name || !last_name) throw new AppError(ERRORS.NAME_REQUIRED, 422);

    const password_hash = await hashPassword(password);
    user = await User.create({
      email:          invite.email,
      password_hash,
      role:           'admin',
      admin_role:     'staff',
      providers:      [{ provider: 'local', provider_id: invite.email }],
      profile:        { first_name, last_name, avatar_url: '' },
      email_verified: true,  // invite link itself verifies email ownership
    });
    logger.info('New admin account created via invite', { userId: user._id });
  }

  await Invite.findByIdAndUpdate(invite._id, { status: 'accepted', accepted_at: new Date() });
  await logEvent({ userId: user!._id.toString(), email: invite.email, event: 'admin_invite_accepted', success: true, ...ctx, metadata: { invited_by: invite.invited_by } });

  const { accessToken, refreshToken } = await createAdminSession(
    user!._id.toString(), user!.email, ctx, 'staff'
  );

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    user: {
      id:             user!._id.toString(),
      email:          user!.email,
      role:           'admin',
      admin_role:     'staff',
      first_name:     user!.profile.first_name,
      last_name:      user!.profile.last_name,
      avatar_url:     user!.profile.avatar_url,
      email_verified: user!.email_verified,
    },
  };
};

// ── List team ─────────────────────────────────────────────────────────────────

export const listTeam = async () => {
  const User = await getUserModel();
  return User.find({ role: 'admin' })
    .select('email admin_role profile is_active last_login created_at')
    .sort({ admin_role: 1, created_at: 1 })
    .lean();
};

// ── Remove staff admin ────────────────────────────────────────────────────────

export const removeFromTeam = async (
  targetId: string,
  ownerId:  string,
  ctx: Ctx
): Promise<void> => {
  if (targetId === ownerId) throw new AppError(ERRORS.CANNOT_REMOVE_SELF, 422);

  const User   = await getUserModel();
  const target = await User.findById(targetId);
  if (!target || target.role !== 'admin') throw new AppError(ERRORS.STAFF_NOT_FOUND, 404);

  if (target.admin_role === 'owner') {
    throw new AppError(ERRORS.CANNOT_REMOVE_OWNER, 422);
  }

  await User.findByIdAndUpdate(targetId, { role: 'user', admin_role: undefined });
  await revokeAllAdminSessions(targetId);

  await logEvent({ userId: targetId, email: target.email, event: 'admin_removed', success: true, ...ctx, metadata: { by: ownerId } });
  logger.info('Admin removed from team', { targetId, by: ownerId });
};

// ── Revoke pending invite ─────────────────────────────────────────────────────

export const revokeInvite = async (inviteId: string, ownerId: string): Promise<void> => {
  const Invite = await getAdminInviteModel();
  const result = await Invite.findOneAndUpdate(
    { _id: inviteId, status: 'pending' },
    { status: 'revoked' }
  );
  if (!result) throw new AppError('Invite not found or already resolved', 404);
  logger.info('Admin invite revoked', { inviteId, by: ownerId });
};
