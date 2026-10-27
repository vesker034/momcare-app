import { useCallback, useRef, useState } from 'react';

import { getDiaryEntries } from '../../../services/api/diaryApi';
import type { DiaryEntry } from '../../../types/api';

export function useDiaryEntries() {
    const [entries, setEntries] = useState<DiaryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const requestIdRef = useRef(0);

    const loadEntries = useCallback(async (): Promise<DiaryEntry[] | null> => {
        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setError('');

        try {
            const response = await getDiaryEntries();
            const list = Array.isArray(response?.entries) ? response.entries : [];
            if (requestId !== requestIdRef.current) return null;
            setEntries(list);
            return list;
        } catch (err) {
            if (requestId === requestIdRef.current) {
                setError(getErrorMessage(err));
            }
            return null;
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const cancelPendingLoad = useCallback(() => {
        requestIdRef.current += 1;
    }, []);

    const findEntryByDate = useCallback(
        (list: DiaryEntry[], dateKey: string): DiaryEntry | null => {
            return list.find((item) => item.date === dateKey) ?? null;
        },
        [],
    );

    return {
        entries,
        isLoading,
        error,
        loadEntries,
        cancelPendingLoad,
        findEntryByDate,
        setError,
    };
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Не удалось загрузить записи дневника.';
}
