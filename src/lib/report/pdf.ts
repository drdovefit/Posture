import { jsPDF } from 'jspdf';
import type { Assessment, Client, Metric } from '../types';

const SEV_LABEL: Record<string, string> = {
  good: 'Good',
  mild: 'Mild',
  moderate: 'Moderate',
};

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front (Anterior)',
  lateral: 'Side (Lateral)',
  posterior: 'Back (Posterior)',
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

/** Generate and download a PDF posture report for a single assessment. */
export async function exportAssessmentPdf(client: Client, a: Assessment) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let yPos = margin;

  // Header
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, pageW, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PostureLab Report', margin, 44);
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

  // Annotated image + score
  const imgBlob = a.annotated ?? a.photo;
  const dataUrl = await blobToDataUrl(imgBlob);
  const imgW = 220;
  const ratio = a.imageHeight / a.imageWidth || 1.4;
  const imgH = imgW * ratio;
  try {
    doc.addImage(dataUrl, 'PNG', margin, yPos, imgW, imgH, undefined, 'FAST');
  } catch {
    /* image may be unsupported format; skip gracefully */
  }

  // Score badge to the right of the image
  const scoreX = margin + imgW + 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Posture Score', scoreX, yPos + 20);
  doc.setFontSize(46);
  const scoreColor: [number, number, number] =
    a.score >= 85 ? [16, 185, 129] : a.score >= 65 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(...scoreColor);
  doc.text(`${a.score}`, scoreX, yPos + 66);
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('/ 100', scoreX + 52, yPos + 66);

  yPos += imgH + 30;
  doc.setTextColor(30, 41, 59);

  // Metrics table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Measurements', margin, yPos);
  yPos += 16;
  doc.setFontSize(10);

  const col = { metric: margin, value: 250, status: 380, normal: 440 };
  doc.setTextColor(100, 116, 139);
  doc.text('Metric', col.metric, yPos);
  doc.text('Value', col.value, yPos);
  doc.text('Status', col.status, yPos);
  doc.text('Normal', col.normal, yPos);
  yPos += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, yPos, pageW - margin, yPos);
  yPos += 14;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');
  a.metrics.forEach((m: Metric) => {
    if (yPos > 760) {
      doc.addPage();
      yPos = margin;
    }
    doc.setTextColor(30, 41, 59);
    doc.text(m.label, col.metric, yPos);
    doc.text(m.display, col.value, yPos);
    const c: [number, number, number] =
      m.severity === 'good' ? [16, 185, 129] : m.severity === 'mild' ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(...c);
    doc.text(SEV_LABEL[m.severity], col.status, yPos);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(m.normal, 150), col.normal, yPos);
    yPos += 18;
  });

  // Suggestions
  const flagged = a.metrics.filter((m) => m.severity !== 'good');
  if (flagged.length) {
    yPos += 14;
    if (yPos > 720) { doc.addPage(); yPos = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('Suggested focus areas', margin, yPos);
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

  // Footer disclaimer
  const footer =
    'PostureLab is an educational tool and does not provide medical advice, diagnosis, or treatment. Consult a qualified professional for health concerns.';
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const fLines = doc.splitTextToSize(footer, pageW - margin * 2);
  doc.text(fLines, margin, doc.internal.pageSize.getHeight() - 30);

  const fname = `posturelab-${client.name.replace(/\s+/g, '_')}-${new Date(a.createdAt)
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(fname);
}
