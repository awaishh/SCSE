import React from 'react';

const KryptLogo = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Tactical Play Triangle */}
    <path
      d="M5 4V20L19 12L5 4Z"
      fill="currentColor"
    />
    {/* Fragmentation Line 1 */}
    <path
      d="M5 12H12"
      stroke="#000"
      strokeOpacity="0.2"
      strokeWidth="1.5"
    />
    {/* Fragmentation Line 2 */}
    <path
      d="M12 12L8 15.5"
      stroke="#000"
      strokeOpacity="0.2"
      strokeWidth="1"
    />
    {/* Small HUD Accent */}
    <rect x="2" y="4" width="2" height="16" fill="currentColor" opacity="0.3" />
  </svg>
);

export default KryptLogo;
