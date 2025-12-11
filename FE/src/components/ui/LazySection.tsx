import dynamic from 'next/dynamic';
import React from 'react';
import SkeletonPlaceholder from './SkeletonPlaceholder';

// Helper to dynamically import heavy components with SSR disabled where necessary
export const lazyImport = (importer: () => Promise<any>, ssr: boolean = false) =>
  dynamic(importer, { ssr, loading: () => <SkeletonPlaceholder /> });

export default lazyImport;
