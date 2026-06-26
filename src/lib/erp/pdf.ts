import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "./types";
import { useErp, fmtDA } from "./store";

export function generateInvoicePdf(order: Order, kind: "Facture" | "Proforma" = "Facture", action: "save" | "print" = "save") {
  const stock = useErp.getState().stock;
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.setTextColor("#A50034");
  doc.text("LG-morchid", 14, 18);
  doc.setFontSize(12);
  doc.setTextColor("#1a1a1a");
  doc.text(`${kind} ${order.ref}`, 14, 28);
  doc.setFontSize(10);
  doc.text(`Date : ${new Date(order.createdAt).toLocaleDateString("fr-DZ")}`, 14, 35);
  doc.text(`Canal : ${order.channel === "site" ? "Site web" : "Showroom"}`, 14, 41);
  doc.text(`Client : ${order.client.firstName} ${order.client.lastName} (${order.client.type === "convention" ? "Conventionné" : "Standard"})`, 14, 47);
  doc.text(`Téléphone : ${order.client.phone}`, 14, 53);
  doc.text(`Adresse de livraison : ${order.client.address}`, 14, 59);

  const rows = order.items.map((it) => {
    const p = stock.find((s) => s.id === it.productId);
    const name = p?.name ?? it.productId;
    const unit = p?.priceSale ?? 0;
    return [name, it.quantity.toString(), fmtDA(unit), fmtDA(unit * it.quantity)];
  });

  autoTable(doc, {
    startY: 68,
    head: [["Article", "Qté", "PU", "Total"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [165, 0, 52] },
  });

  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Total TTC : ${fmtDA(order.total)}`, 14, endY);
  doc.setFontSize(9);
  doc.setTextColor("#666");
  doc.text("Merci pour votre confiance — LG-morchid", 14, 285);

  if (action === "print") {
    doc.autoPrint();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  } else {
    doc.save(`${kind}-${order.ref}.pdf`);
  }
}

export function exportOrderCsv(order: Order) {
  const stock = useErp.getState().stock;
  const lines = [
    ["Référence", order.ref],
    ["Date", new Date(order.createdAt).toLocaleDateString("fr-DZ")],
    ["Canal", order.channel],
    ["Client", `${order.client.firstName} ${order.client.lastName}`],
    ["Type client", order.client.type],
    ["Téléphone", order.client.phone],
    ["Adresse", order.client.address],
    ["Statut", order.status],
    [],
    ["Article", "Qté", "PU (DA)", "Total (DA)"],
  ];
  for (const it of order.items) {
    const p = stock.find((s) => s.id === it.productId);
    lines.push([p?.name ?? it.productId, String(it.quantity), String(p?.priceSale ?? 0), String((p?.priceSale ?? 0) * it.quantity)]);
  }
  lines.push([], ["Total initial", String(order.totalInitial)]);
  lines.push(["Total TTC", String(order.total)]);
  const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${order.ref}.csv`; a.click();
  URL.revokeObjectURL(url);
}
