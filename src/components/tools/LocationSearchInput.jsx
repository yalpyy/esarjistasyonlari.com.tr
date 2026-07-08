import { useEffect, useRef, useState } from 'react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 450;
const MIN_QUERY_LENGTH = 3;

/**
 * OSM Nominatim ile Türkiye içi adres/şehir arayan, debounce'lu input.
 * Seçim yapılınca onSelect({ label, lat, lng }) çağrılır.
 */
export default function LocationSearchInput({ placeholder, value, onSelect, onClear }) {
  const [query, setQuery] = useState(value?.label || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const wrapperRef = useRef(null);

  // Dışarıdan gelen değer değişirse inputu senkronla (swap butonu için)
  useEffect(() => {
    setQuery(value?.label || '');
  }, [value]);

  // Dışarı tıklayınca öneri listesini kapat
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = (text) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);

    const params = new URLSearchParams({
      format: 'json',
      q: text,
      countrycodes: 'tr',
      limit: '5',
      'accept-language': 'tr',
    });

    fetch(`${NOMINATIM_URL}?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSuggestions(
          (data || []).map((d) => ({
            label: d.display_name,
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          }))
        );
        setOpen(true);
      })
      .catch(() => {})
      .finally(() => setSearching(false));
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (value) onClear?.();

    clearTimeout(timerRef.current);
    if (text.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    // Debounce: API limitlerine takılmamak için
    timerRef.current = setTimeout(() => search(text.trim()), DEBOUNCE_MS);
  };

  const handleSelect = (s) => {
    setQuery(s.label);
    setSuggestions([]);
    setOpen(false);
    onSelect(s);
  };

  return (
    <div className="loc-search" ref={wrapperRef}>
      <input
        type="text"
        className="loc-search-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {searching && <span className="loc-search-spinner" aria-hidden="true" />}

      {open && suggestions.length > 0 && (
        <ul className="loc-search-dropdown" role="listbox">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                className="loc-search-option"
                onClick={() => handleSelect(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
