import React, { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  className?: string;
  /** Classes for the initials fallback text */
  textClassName?: string;
}

/** Shows Ramesh's photo; falls back to initials if the image is missing or fails to load. */
export const Avatar: React.FC<AvatarProps> = ({ src, name, className = '', textClassName = '' }) => {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`object-cover object-top ${className}`}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center font-bold ${className} ${textClassName}`} aria-label={name}>
      {initials}
    </div>
  );
};
