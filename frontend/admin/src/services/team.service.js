import api from './apiClient';

export const getTeam = async () => {
  const { data } = await api.get('/admin/team');
  return data.data;
};

export const inviteMember = async (email) => {
  const { data } = await api.post('/admin/team/invite', { email });
  return data;
};

export const removeMember = async (id) => {
  await api.delete(`/admin/team/${id}`);
};

export const revokeInvite = async (id) => {
  await api.delete(`/admin/team/invites/${id}`);
};

export const getInviteInfo = async (token) => {
  const { data } = await api.get(`/admin/invite/${token}`);
  return data.data;
};

export const acceptInvite = async (payload) => {
  const { data } = await api.post('/admin/invite/accept', payload);
  return data.data;
};
