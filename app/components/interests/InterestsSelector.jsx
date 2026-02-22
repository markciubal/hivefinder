'use client';

import { useState } from 'react';
import interestsList from '../../../utilities/interests.json';

export default function InterestsSelector({
  selectedInterests,
  setSelectedInterests,
  title = 'Interests',
  description = 'These are used in Friend Finder to match you with other students.',
  helperText = 'Click to add or remove interests:',
  collapsible = true,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(!collapsible || defaultOpen);
  const [searchTerm, setSearchTerm] = useState('');
  const safeSelected = Array.isArray(selectedInterests) ? selectedInterests : [];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInterests = interestsList.filter((interest) =>
    normalizedSearch
      ? String(interest).toLowerCase().includes(normalizedSearch)
      : true
  );

  const updateSelected = (updater) => {
    if (typeof setSelectedInterests !== 'function') return;
    setSelectedInterests((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      return updater(base);
    });
  };

  const toggleInterest = (interest) => {
    updateSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const removeInterest = (interest) => {
    updateSelected((prev) => prev.filter((i) => i !== interest));
  };

  return (
    <section className="border border-gray-200 rounded-lg p-4 bg-neutral-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          {description && (
            <p className="text-xs text-gray-600">
              {description}
            </p>
          )}
        </div>
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="rounded bg-green-800 text-white px-3 py-1 text-sm font-semibold hover:bg-green-700"
          >
            {isOpen ? 'Close' : 'Add / Edit'}
          </button>
        )}
      </div>

      {safeSelected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {safeSelected.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-800 text-white"
            >
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(interest)}
                className="ml-1 text-white/80 hover:text-white"
                aria-label={`Remove ${interest}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="mt-4 border-t border-gray-300 pt-3">
          {helperText && (
            <p className="text-xs text-gray-600 mb-2">
              {helperText}
            </p>
          )}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">
              Search interests
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Type to filter interests..."
              />
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                disabled={!searchTerm.trim()}
                className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto w-full rounded-lg bg-white border border-gray-200 p-3">
            {filteredInterests.length === 0 ? (
              <p className="text-sm text-gray-600">
                No interests match your search.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filteredInterests.map((interest) => {
                  const isSelected = safeSelected.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={
                        'px-3 py-1 rounded-full text-xs border transition ' +
                        (isSelected
                          ? 'bg-green-800 text-white border-green-800'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100')
                      }
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
