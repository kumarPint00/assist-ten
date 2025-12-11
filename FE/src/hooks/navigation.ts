'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useParams as useNextParams } from 'next/navigation';

// Hook to replace React Router's useNavigate
export const useNavigate = () => {
  const router = useRouter();
  
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      }
    } else {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  };
};

// Hook to replace React Router's useLocation
export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  return {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    state: null, // Next.js doesn't support location state
  };
};

// Re-export useParams from Next.js
export const useParams = useNextParams;