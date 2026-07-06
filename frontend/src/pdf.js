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
  // Responsive : le graphique remplit sa carte sans jamais déborder (aspect conservé)
  out.style.cssText = "width:100%;height:auto;display:block;";
  return out;
}

// Clone le compte rendu en remplaçant chaque conteneur de graphique Recharts par un PNG responsive
async function cloneResultsWithRasterCharts(resultsEl) {
  const origContainers = [...resultsEl.querySelectorAll(".recharts-responsive-container")];
  const meta = origContainers.map((c) => {
    const svg = c.querySelector("svg");
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { svg, w: Math.round(r.width) || svg.clientWidth, h: Math.round(r.height) || svg.clientHeight };
  });

  const clone = resultsEl.cloneNode(true);
  const cloneContainers = [...clone.querySelectorAll(".recharts-responsive-container")];
  for (let i = 0; i < cloneContainers.length; i++) {
    const m = meta[i];
    if (!m || !m.w || !m.h) continue;
    try {
      const img = await svgToImg(m.svg, m.w, m.h);
      cloneContainers[i].replaceWith(img); // remplace tout le conteneur (supprime la largeur fixe)
    } catch { /* garde le graphique original si la rasterisation échoue */ }
  }
  return clone;
}

// Construit un conteneur hors-écran (header Evolys + compte rendu) pour la capture
function buildPrintNode({ resultsClone, address, dateStr, logoUrl, width }) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    `position:fixed;left:-10000px;top:0;width:${width}px;background:#ffffff;padding:32px;` +
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

  // Gabarit calé sur la largeur réelle du compte rendu (les graphiques, responsive, remplissent leur carte)
  const contentWidth = Math.max(700, Math.ceil(resultsEl.getBoundingClientRect().width));
  const printWidth = contentWidth + 64; // + padding gauche/droite

  const resultsClone = await cloneResultsWithRasterCharts(resultsEl);
  const wrap = buildPrintNode({ resultsClone, address, dateStr, logoUrl, width: printWidth });
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

  const SCALE = 2;
  // Zones à ne jamais couper (graphiques + grilles de KPIs), mesurées avant capture
  const wrapTop = wrap.getBoundingClientRect().top;
  const blocks = [...wrap.querySelectorAll(".chart, .kpi-grid")].map((el) => {
    const r = el.getBoundingClientRect();
    return { top: (r.top - wrapTop) * SCALE, bottom: (r.bottom - wrapTop) * SCALE };
  });

  const canvas = await html2canvas(wrap, {
    scale: SCALE, backgroundColor: "#ffffff", useCORS: true, logging: false,
  });
  document.body.removeChild(wrap);

  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210, pageH = 297, margin = 10, footerH = 30;
  const imgW = pageW - margin * 2;
  const pxPerMm = canvas.width / imgW;
  const pageContentPx = (pageH - margin - footerH) * pxPerMm;

  // Construit des tranches de page qui ne traversent aucun bloc insécable
  const total = canvas.height;
  const slices = [];
  let y = 0;
  while (y < total - 1) {
    let end = Math.min(y + pageContentPx, total);
    if (end < total) {
      for (const b of blocks) {
        if (b.top > y && b.top < end && b.bottom > end) { end = b.top; break; }
      }
    }
    if (end <= y) end = Math.min(y + pageContentPx, total); // garde-fou anti-boucle
    end = Math.round(end);
    slices.push([y, end]);
    y = end;
  }

  // Rend chaque tranche sur sa propre page
  slices.forEach(([sy, ey], i) => {
    if (i > 0) pdf.addPage();
    const h = ey - sy;
    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = h;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.drawImage(canvas, 0, sy, canvas.width, h, 0, 0, canvas.width, h);
    pdf.addImage(tmp.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, h / pxPerMm);
  });

  // Pied de page légal en bas de la DERNIÈRE page (bande blanche + texte)
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
  let fy = pageH - footerH + 8;
  pdf.text(l1, margin, fy);
  fy += l1.length * 3.3 + 2.5;
  pdf.text(l2, margin, fy);

  const slug = (address || "bien").slice(0, 40).replace(/[^\w-]+/g, "_");
  pdf.save(`estimation-evolys-${slug}.pdf`);
}
