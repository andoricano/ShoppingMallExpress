'use client';

import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/useAdminAuth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const getSession = useAdminAuthStore((state) => state.getSession);

    useEffect(() => {
        getSession();
    }, [getSession]);

    return <>{children}</>;
}