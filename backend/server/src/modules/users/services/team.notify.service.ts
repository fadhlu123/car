import { env } from '../../../configs/env.config';
import { dispatch } from '../../notifications/services/notification.dispatcher';

export const sendAdminInviteEmail = (
  inviteeEmail: string,
  rawToken:     string,
  inviterName:  string
): Promise<void> => {
  // Must point at the admin app's own origin + its actual route (/accept-invite,
  // not /admin/accept-invite — there is no /admin prefix in the admin app's router).
  const token = encodeURIComponent(rawToken);
  const inviteUrl = `${env.ADMIN_CLIENT_URL.replace(/\/$/, '')}/accept-invite/${token}?token=${token}`;
  return dispatch({ type: 'admin_invite', email: inviteeEmail, inviterName, inviteUrl });
};

export const notifyInviteAccepted = (
  inviterAdminId:  string,
  newMemberName:   string,
  newMemberEmail:  string
): Promise<void> =>
  dispatch({ type: 'invite_accepted', adminId: inviterAdminId, newMemberName, newMemberEmail });

export const notifyTeamMemberRemoved = (
  actorAdminId: string,
  removedName:  string
): Promise<void> =>
  dispatch({ type: 'team_member_removed', adminId: actorAdminId, removedName });
