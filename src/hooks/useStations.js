import { useState, useEffect, useMemo } from 'react';
import { fetchStations, normalizeStation } from '../utils/api';
import { calculateDistance } from '../utils/distance';

export function useStations(userPosition) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dc: false,
    ac: false,
    free: false,
    operator: '',
    search: '',
  });

  useEffect(() => {
    setLoading(true);
    fetchStations()
      .then((data) => {
        const normalized = data.map(normalizeStation);
        setStations(normalized);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const operators = useMemo(() => {
    const ops = new Set(stations.map((s) => s.operator).filter(Boolean));
    return Array.from(ops).sort();
  }, [stations]);

  const filtered = useMemo(() => {
    let result = stations;

    if (filters.dc) result = result.filter((s) => s.isDC);
    if (filters.ac) result = result.filter((s) => s.isAC);
    if (filters.free) result = result.filter((s) => s.isFree);
    if (filters.operator) result = result.filter((s) => s.operator === filters.operator);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q)
      );
    }

    if (userPosition) {
      result = result
        .map((s) => ({
          ...s,
          calculatedDistance: calculateDistance(userPosition.lat, userPosition.lng, s.lat, s.lng),
        }))
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    }

    return result;
  }, [stations, filters, userPosition]);

  return { stations: filtered, allStations: stations, loading, error, filters, setFilters, operators };
}
