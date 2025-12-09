'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(() => router.push('/dashboard'))
        .catch(() => {
          api.removeToken();
          router.push('/login');
        });
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <div className="loading-spinner" />
    </div>
  );
}
