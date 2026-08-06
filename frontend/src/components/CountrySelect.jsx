// src/components/CountrySelect.jsx
// ============================================================
// COUNTRY SELECT - Reusable searchable country dropdown.
//
//   - Displays all countries from the standardized ISO-based
//     list (src/utils/countries.js)
//   - Shows the country flag next to the name (UI only - flags
//     are never sent to / stored in the database)
//   - Type to search (name or ISO code)
//   - Full keyboard navigation (arrows / Enter / Escape / Tab)
//   - Responsive, light & dark theme, matches the existing
//     HomelyServ form styling
//
// Value shape emitted: { countryCode: 'EG', countryName: 'Egypt' }
// ============================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, ChevronDown, Search, Check } from 'lucide-react';
import { countries } from '../utils/countries';

const CountrySelect = ({
  value = '', // selected ISO country code
  onChange, // ({ countryCode, countryName }) => void
  error = false,
  placeholder = 'Select your country',
  id = 'country',
  name = 'country',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === value) || null,
    [value]
  );

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // On open: reset the search, highlight the current selection
  // (or the first entry) and focus the search input.
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    const selectedIndex = countries.findIndex((c) => c.code === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    const timer = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset highlight when the search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Keep the highlighted option visible while navigating
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const option = listRef.current.children[highlightedIndex];
    option?.scrollIntoView?.({ block: 'nearest' });
  }, [highlightedIndex, isOpen]);

  const selectCountry = (country) => {
    if (!country) return;
    onChange?.({ countryCode: country.code, countryName: country.name });
    setIsOpen(false);
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleSearchKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filteredCountries.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        selectCountry(filteredCountries[highlightedIndex] || filteredCountries[0]);
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative group">
      <MapPin
        size={18}
        className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500 group-focus-within:text-red-500 transition-colors z-10 pointer-events-none"
      />
      <button
        type="button"
        id={id}
        name={name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleButtonKeyDown}
        className={`w-full pl-11 pr-10 py-3.5 bg-gray-50 dark:bg-gray-900/80 border ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
        } rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-left flex items-center`}
      >
        {selectedCountry ? (
          <span className="flex items-center gap-2 truncate">
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <span className="text-gray-800 dark:text-gray-100 truncate">{selectedCountry.name}</span>
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
        )}
      </button>
      <ChevronDown
        size={16}
        className={`absolute right-3.5 top-4 text-gray-400 dark:text-gray-500 pointer-events-none transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`}
      />

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search countries..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-gray-400 dark:text-gray-100"
              />
            </div>
          </div>
          <ul ref={listRef} role="listbox" aria-label="Countries" className="max-h-60 overflow-y-auto py-1">
            {filteredCountries.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">No countries found</li>
            )}
            {filteredCountries.map((country, index) => {
              const isSelected = selectedCountry?.code === country.code;
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={country.code}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectCountry(country)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-red-50 dark:bg-red-900/20' : ''
                  } ${
                    isSelected
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  {isSelected && <Check size={15} className="text-red-500 flex-shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;
