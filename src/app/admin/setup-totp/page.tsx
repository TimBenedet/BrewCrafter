
'use client';

import { notFound } from 'next/navigation';
import { useEffect } from 'react';

export default function SetupTotpPage() {
  useEffect(() => {
    notFound();
  }, []);

  return null; // This will not be rendered as notFound() is called
}
