/**
 * Share a real file (image or PDF) through the OS share sheet on mobile, or
 * download it on desktop. Never shares a blob: URL as a link — those are
 * device-local and arrive as a dead "blob" link for the recipient, which is
 * the bug that sent someone the word "blob" and a broken PostureLab URL.
 */
export async function shareOrDownloadFile(file: File, title?: string): Promise<void> {
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return;
    } catch (e) {
      // User cancelled the share sheet — do nothing, don't fall back.
      if ((e as { name?: string })?.name === 'AbortError') return;
      // Any other error: fall through to a download so they still get the file.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
