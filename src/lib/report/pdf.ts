import { jsPDF } from 'jspdf';
import type { Assessment, Client, Metric } from '../types';
import { BRAND_IMAGE_KEYS, storedBrandImage } from '../brandImages';

const SEV_LABEL: Record<string, string> = {
  good: 'Good',
  mild: 'Mild',
  moderate: 'Moderate',
};

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

/** Load the QR image as a data URL for the report header (null if missing). */
async function loadQrDataUrl(): Promise<string | null> {
  try {
    const src =
      storedBrandImage(BRAND_IMAGE_KEYS.qr) ?? `${import.meta.env.BASE_URL}brand/qr.png`;
    const res = await fetch(src);
    if (!res.ok) return null;
    return await blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

/** Generate and download a PDF posture report for a single assessment. */
export async function exportAssessmentPdf(client: Client, a: Assessment) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let yPos = margin;

  // Header (blue bar). The QR sits in the top-right on a white tile.
  const qrData = await loadQrDataUrl();
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PostureLab Report', margin, 44);
  if (qrData) {
    const qrSize = 50;
    const qx = pageW - margin - qrSize;
    const qy = (70 - qrSize) / 2;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qx - 4, qy - 4, qrSize + 8, qrSize + 8, 4, 4, 'F');
    try {
      doc.addImage(qrData, 'PNG', qx, qy, qrSize, qrSize, undefined, 'FAST');
    } catch {
      /* QR format unsupported; skip */
    }
  }
  yPos = 96;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Client: ${client.name}`, margin, yPos);
  doc.text(
    `Date: ${new Date(a.createdAt).toLocaleString()}`,
    pageW - margin,
    yPos,
    { align: 'right' },
  );
  yPos += 18;
  doc.text(`View: ${VIEW_LABEL[a.view] ?? a.view}`, margin, yPos);
  yPos += 24;

  // Annotated image on the left; score and measurements stacked in the right
  // column so the space beside the image isn't wasted.
  const imgBlob = a.annotated ?? a.photo;
  const dataUrl = await blobToDataUrl(imgBlob);
  const imgW = 200;
  const ratio = a.imageHeight / a.imageWidth || 1.4;
  const imgH = Math.min(imgW * ratio, 360);
  try {
    doc.addImage(dataUrl, 'PNG', margin, yPos, imgW, imgH, undefined, 'FAST');
  } catch {
    /* image may be unsupported format; skip gracefully */
  }

  const rightX = margin + imgW + 28;
  const rightW = pageW - rightX - margin;
  let ry = yPos;

  const sev = (m: Metric): [number, number, number] =>
    m.severity === 'good' ? [16, 185, 129] : m.severity === 'mild' ? [245, 158, 11] : [239, 68, 68];

  // Score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('Posture Score', rightX, ry + 12);
  doc.setFontSize(40);
  const scoreColor: [number, number, number] =
    a.score >= 85 ? [16, 185, 129] : a.score >= 65 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(...scoreColor);
  doc.text(`${a.score}`, rightX, ry + 50);
  const sw = doc.getTextWidth(`${a.score}`);
  doc.setFontSize(13);
  doc.setTextColor(100, 116, 139);
  doc.text('/ 100', rightX + sw + 6, ry + 50);
  ry += 74;

  // Compact measurements list under the score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Measurements', rightX, ry);
  ry += 16;
  doc.setFontSize(9.5);
  a.metrics.forEach((m: Metric) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const labelLines = doc.splitTextToSize(m.label, rightW - 52);
    doc.text(labelLines, rightX, ry);
    doc.setTextColor(...sev(m));
    doc.text(SEV_LABEL[m.severity], rightX + rightW, ry, { align: 'right' });
    ry += labelLines.length * 11;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(m.display, rightX, ry);
    ry += 15;
  });

  yPos = Math.max(yPos + imgH, ry) + 26;
  doc.setTextColor(30, 41, 59);

  // Suggestions
  const flagged = a.metrics.filter((m) => m.severity !== 'good');
  if (flagged.length) {
    yPos += 14;
    if (yPos > 720) { doc.addPage(); yPos = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('What to work on', margin, yPos);
    yPos += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    flagged.forEach((m) => {
      if (yPos > 770) { doc.addPage(); yPos = margin; }
      const lines = doc.splitTextToSize(`• ${m.label}: ${m.explanation}`, pageW - margin * 2);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 13 + 4;
    });
  }

  // Footer fine print
  const footer = 'PostureLab is an educational tool, not medical advice.';
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const fLines = doc.splitTextToSize(footer, pageW - margin * 2);
  doc.text(fLines, margin, doc.internal.pageSize.getHeight() - 30);

  const fname = `posturelab-${client.name.replace(/\s+/g, '_')}-${new Date(a.createdAt)
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(fname);
}
