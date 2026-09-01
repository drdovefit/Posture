import { createPortal } from 'react-dom';
import { TERMS_HTML, PRIVACY_HTML } from '../legal/documents';

/** A scrollable reader for the Terms of Service or Privacy Policy. */
export default function LegalDoc({
  doc,
  onClose,
}: {
  doc: 'terms' | 'privacy';
  onClose: () => void;
}) {
  const html = doc === 'terms' ? TERMS_HTML : PRIVACY_HTML;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card relative flex max-h-[88vh] w-full max-w-2xl flex-col p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-300"
        >
          ✕
        </button>
        <div className="legal-doc overflow-y-auto px-6 py-6" dangerouslySetInnerHTML={{ __html: html }} />
        <style>{`
          .legal-doc h1 { font-size: 1.35rem; font-weight: 700; margin: 0 0 4px; }
          .legal-doc h2 { font-size: 1.02rem; font-weight: 600; margin: 1.4rem 0 0.3rem; }
          .legal-doc p { font-size: 0.9rem; line-height: 1.6; margin: 0.55rem 0; }
          .legal-doc ul { font-size: 0.9rem; line-height: 1.6; padding-left: 20px; margin: 0.55rem 0; }
          .legal-doc li { margin: 0.35rem 0; }
          .legal-doc .meta { font-size: 0.78rem; opacity: 0.7; }
          .legal-doc b { font-weight: 600; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
