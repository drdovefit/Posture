import { useEffect, useState } from 'react';

/** Create an object URL for a Blob and revoke it on change/unmount. */
export function useBlobUrl(blob: Blob | undefined | null): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
