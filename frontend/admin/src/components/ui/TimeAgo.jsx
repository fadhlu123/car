import { useState, useEffect } from 'react';

export const formatTimeAgo = (date) => {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  const year = Math.floor(day / 365);
  return `${year}y ago`;
};

// How long until the label would actually flip to the next unit, so we can
// schedule exactly one re-render at that point rather than polling blindly.
const nextUpdateDelayMs = (date) => {
  const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSec < 5) return (5 - diffSec) * 1000;
  if (diffSec < 60) return 1000;
  if (diffSec < 3600) return 60 * 1000;
  if (diffSec < 86400) return 60 * 60 * 1000;
  return 6 * 60 * 60 * 1000;
};

// Live-ticking relative timestamp: "2s ago" climbs to "1m ago", "3h ago",
// "1w ago", "2mo ago" etc. on its own without a page refresh.
const TimeAgo = ({ date, className }) => {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!date) return undefined;
    const timer = setTimeout(() => tick((t) => t + 1), nextUpdateDelayMs(date));
    return () => clearTimeout(timer);
  });

  if (!date) return null;
  return <span className={className}>{formatTimeAgo(date)}</span>;
};

export default TimeAgo;
