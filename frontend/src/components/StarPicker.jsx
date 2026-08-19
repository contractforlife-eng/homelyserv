// frontend/src/components/StarPicker.jsx
// Reusable 5-star integer rating picker.
// - Exactly 5 stars, integer selection only, no half stars.
// - Touch-friendly and accessible (button semantics, aria-labels).
// - Uses lucide-react Star icon consistent with the rest of HomelyServ.
import React from 'react';
import { Star } from 'lucide-react';

const TOTAL_STARS = 5;

const StarPicker = ({
  value = 0,
  onChange,
  disabled = false,
  size = 24,
  label = 'rating'
}) => {
  const handleSelect = (starValue) => {
    if (disabled || !onChange) return;
    // Integer only — clicking a star always sets an exact integer.
    onChange(starValue);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1 justify-center"
    >
      {Array.from({ length: TOTAL_STARS }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={filled}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            disabled={disabled}
            onClick={() => handleSelect(starValue)}
            className={`
              p-1 rounded-full transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400
              disabled:cursor-not-allowed
              ${filled
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300 dark:hover:text-yellow-400'}
            `}
          >
            <Star
              size={size}
              className={filled ? 'fill-current' : ''}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarPicker;
