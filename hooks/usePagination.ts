import { useState, useMemo, useEffect } from 'react';
import { Participant } from '../utils/types';

const MAX_TILES_PER_PAGE = 16;
const SIDEBAR_PAGE_SIZE = 4;

export function usePagination(
  participants: Participant[], 
  pinnedId: string | null
) {
  const [currentPage, setCurrentPage] = useState(0);

  const unpinnedParticipants = useMemo(() => {
    return pinnedId ? participants.filter(p => p.id !== pinnedId) : participants;
  }, [participants, pinnedId]);

  const pageSize = pinnedId ? SIDEBAR_PAGE_SIZE : MAX_TILES_PER_PAGE;
  const totalPages = Math.ceil(unpinnedParticipants.length / pageSize);

  // Reset page if out of bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  // Reset page when pinnedId changes (e.g. switching between grid and pinned view)
  useEffect(() => {
      setCurrentPage(0);
  }, [pinnedId]);

  const visibleParticipants = useMemo(() => {
    const start = currentPage * pageSize;
    return unpinnedParticipants.slice(start, start + pageSize);
  }, [unpinnedParticipants, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    visibleParticipants
  };
}