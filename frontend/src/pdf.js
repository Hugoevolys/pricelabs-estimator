import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Mentions légales fixes (bas de dernière page)
const FOOTER_FIXED =
  "ARM IMMO (Réseau Evolys) — SAS, 809 rue de Croixmare, 76510 Saint-Nicolas-d'Aliermont — " +
  "RCS Dieppe 927 684 944 — Carte T n° CPI 7602 2025 000 000 001 (CCI de Rouen Métropole) — " +
  "Non-détention de fonds.";

// Ligne conseiller (champs variables renseignés dans le formulaire)
function advisorLine(a) {
  return (
    `${a.name}, agent commercial immobilier immatriculé au RSAC ${a.city} ` +
    `n° ${a.rsac} — EI — ${a.address} — agissant au nom et pour le compte d'ARM IMMO.`
  );
}

// Construit un conteneur hors-écran (header Evolys + copie du compte rendu) pour la capture
function buildPrintNode({ resultsEl, address, dateStr, logoUrl }) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:fixed;left:-10000px;top:0;width:760px;background:#ffffff;padding:32px 32px 150px;" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101a33;";

  const header = document.createElement("div");
  header.style.cssText =
    "margin-bottom:20px;border-bottom:2px solid #00286e;padding-bottom:14px;";
  header.innerHTML =
    `<img src="${logoUrl}" alt="Evolys" style="height:40px;display:block;margin-bottom:12px;" />` +
    `<div style="font-size:20px;font-weight:700;color:#00286e;">Estimation de revenus — Location courte durée</div>` +
    (address ? `<div style="font-size:14px;margin-top:6px;">${address}</div>` : "") +
    `<div style="font-size:12px;color:#64748b;margin-top:4px;">Établie le ${dateStr}</div>`;

  wrap.appendChild(header);
  wrap.appendChild(resultsEl.cloneNode(true));
  return wrap;
}

export async function downloadReportPdf({ resultsEl, advisor, address, logoUrl }) {
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const wrap = buildPrintNode({ resultsEl, address, dateStr, logoUrl });
  document.body.appendChild(wrap);

  // Attendre le chargement du logo pour qu'il apparaisse dans la capture
  await new Promise((res) => {
    const img = wrap.querySelector("img");
    if (img && !img.complete) { img.onload = res; img.onerror = res; }
    else res();
  });

  const canvas = await html2canvas(wrap, {
    scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
  });
  document.body.removeChild(wrap);

  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210, pageH = 297, margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.92); // JPEG = PDF beaucoup plus léger

  // Pagination : on décale l'image page par page
  let heightLeft = imgH;
  let position = margin;
  pdf.addImage(img, "JPEG", margin, position, imgW, imgH);
  heightLeft -= pageH - margin * 2;
  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgH - heightLeft);
    pdf.addImage(img, "JPEG", margin, position, imgW, imgH);
    heightLeft -= pageH - margin * 2;
  }

  // Pied de page légal en bas de la DERNIÈRE page (bande blanche + texte)
  const footerH = 34;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, pageH - footerH, pageW, footerH, "F");
  pdf.setDrawColor(0, 40, 110);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageH - footerH + 2, pageW - margin, pageH - footerH + 2);

  pdf.setFontSize(7.5);
  pdf.setTextColor(60, 72, 90);
  const maxW = pageW - margin * 2;
  const l1 = pdf.splitTextToSize(FOOTER_FIXED, maxW);
  const l2 = pdf.splitTextToSize(advisorLine(advisor), maxW);
  let y = pageH - footerH + 8;
  pdf.text(l1, margin, y);
  y += l1.length * 3.3 + 2.5;
  pdf.text(l2, margin, y);

  const slug = (address || "bien").slice(0, 40).replace(/[^\w-]+/g, "_");
  pdf.save(`estimation-evolys-${slug}.pdf`);
}
