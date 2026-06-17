import { AppError } from '../../../utils/error.utils';
import { getUserModel } from '../../auth/models/user.model';
import { UserSummary } from '../../auth/types/auth.types';

const ERRORS = {
  USER_NOT_FOUND: 'User not found',
} as const;

export interface ProfileUpdate {
  first_name?: string;
  last_name?:  string;
  avatar_url?: string;
}

export const getProfile = async (userId: string): Promise<UserSummary> => {
  const User = await getUserModel();
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  return {
    id:             user._id.toString(),
    email:          user.email,
    role:           user.role,
    admin_role:     user.admin_role,
    first_name:     user.profile.first_name,
    last_name:      user.profile.last_name,
    avatar_url:     user.profile.avatar_url,
    email_verified: user.email_verified,
  };
};

export const updateProfile = async (userId: string, updates: ProfileUpdate): Promise<UserSummary> => {
  const User = await getUserModel();

  const set: Record<string, string> = {};
  if (updates.first_name !== undefined) set['profile.first_name'] = updates.first_name.trim();
  if (updates.last_name  !== undefined) set['profile.last_name']  = updates.last_name.trim();
  if (updates.avatar_url !== undefined) set['profile.avatar_url'] = updates.avatar_url.trim();

  const user = await User.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean();
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  return {
    id:             user._id.toString(),
    email:          user.email,
    role:           user.role,
    admin_role:     user.admin_role,
    first_name:     user.profile.first_name,
    last_name:      user.profile.last_name,
    avatar_url:     user.profile.avatar_url,
    email_verified: user.email_verified,
  };
};
