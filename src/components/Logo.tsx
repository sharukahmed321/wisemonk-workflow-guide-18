
import React from 'react';

export function Logo() {
  return (
    <div className="overflow-clip relative shrink-0 w-[42px] h-[42px]">
      <div className="absolute h-full left-0 top-0 w-full flex items-center justify-center">
        <svg
          className="block w-8 h-8"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 32 32"
        >
          <path
            d="M4 28L10 4H14L18 20L22 4H26L20 28H16L12 12L8 28H4Z"
            fill="#5048E5"
            stroke="none"
          />
        </svg>
      </div>
    </div>
  );
}
