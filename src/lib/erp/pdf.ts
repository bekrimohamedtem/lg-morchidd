import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "./types";
import { useErp, fmtDA } from "./store";

export function generateInvoicePdf(order: Order, kind: "Facture" | "Proforma" = "Facture") {
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
  doc.text(`Client : ${order.client.firstName} ${order.client.lastName}`, 14, 41);
  doc.text(`Téléphone : ${order.client.phone}`, 14, 47);
  doc.text(`Adresse : ${order.client.address}`, 14, 53);

  const rows = order.items.map((it) => {
    const p = stock.find((s) => s.id === it.productId);
    const name = p?.name ?? it.productId;
    const unit = p?.priceSale ?? 0;
    return [name, it.quantity.toString(), fmtDA(unit), fmtDA(unit * it.quantity)];
  });

  autoTable(doc, {
    startY: 62,
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

  doc.save(`${kind}-${order.ref}.pdf`);
}
