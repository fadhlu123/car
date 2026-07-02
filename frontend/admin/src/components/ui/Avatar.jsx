import React from 'react';
import { User } from 'lucide-react';

const initialsOf = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// Renders the real uploaded photo when one exists; otherwise falls back to
// initials (if a name is given) or a generic user icon.
const Avatar = ({ url, name, size = 'w-8 h-8', iconSize = 'h-4 w-4', className = '' }) => {
  if (url) {
    return <img src={url} alt={name || 'avatar'} className={`${size} rounded-full object-cover shrink-0 ${className}`} />;
  }
  const initials = initialsOf(name);
  return (
    <div className={`${size} rounded-full bg-primary-700 flex items-center justify-center shrink-0 ${className}`}>
      {initials ? (
        <span className="text-xs font-bold text-white">{initials}</span>
      ) : (
        <User className={`${iconSize} text-primary-400`} />
      )}
    </div>
  );
};

export default Avatar;
