import { dispatch } from '../../notifications/services/notification.dispatcher';

export const sendAdminInviteEmail = (
  inviteeEmail: string,
  rawToken:     string,
  inviterName:  string
): Promise<void> => {
  const inviteUrl = `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/admin/accept-invite?token=${rawToken}`;
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
