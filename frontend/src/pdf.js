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

// Rasterise un SVG en <img> PNG (html2canvas rend mal les SVG Recharts)
async function svgToImg(svgEl, width, height) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", width);
  clone.setAttribute("height", height);
  const xml = new XMLSerializer().serializeToString(clone);
  const src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));

  const image = new Image();
  await new Promise((res, rej) => {
    image.onload = res;
    image.onerror = rej;
    image.src = src;
  });

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.drawImage(image, 0, 0, width, height);

  const out = document.createElement("img");
  out.src = canvas.toDataURL("image/png");
  out.style.cssText = `width:${width}px;height:${height}px;display:block;`;
  return out;
}

// Clone le compte rendu en remplaçant chaque graphique SVG par un PNG
async function cloneResultsWithRasterCharts(resultsEl) {
  const origSvgs = [...resultsEl.querySelectorAll("svg")];
  const sizes = origSvgs.map((s) => {
    const r = s.getBoundingClientRect();
    return { w: Math.round(r.width) || s.clientWidth, h: Math.round(r.height) || s.clientHeight };
  });

  const clone = resultsEl.cloneNode(true);
  const cloneSvgs = [...clone.querySelectorAll("svg")];
  for (let i = 0; i < cloneSvgs.length; i++) {
    const { w, h } = sizes[i] || {};
    if (!w || !h) continue;
    try {
      const img = await svgToImg(origSvgs[i], w, h);
      cloneSvgs[i].replaceWith(img);
    } catch { /* garde le SVG si la rasterisation échoue */ }
  }
  return clone;
}

// Construit un conteneur hors-écran (header Evolys + compte rendu) pour la capture
function buildPrintNode({ resultsClone, address, dateStr, logoUrl }) {
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
  wrap.appendChild(resultsClone);
  return wrap;
}

export async function downloadReportPdf({ resultsEl, advisor, address, logoUrl }) {
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const resultsClone = await cloneResultsWithRasterCharts(resultsEl);
  const wrap = buildPrintNode({ resultsClone, address, dateStr, logoUrl });
  document.body.appendChild(wrap);

  // Attendre le chargement de toutes les images (logo + graphiques rasterisés)
  await Promise.all(
    [...wrap.querySelectorAll("img")].map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => { img.onload = res; img.onerror = res; })
    )
  );

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
