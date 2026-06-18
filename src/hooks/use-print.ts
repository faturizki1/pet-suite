"use client";

import { useCallback } from "react";

interface ReceiptData {
  noTransaksi: string;
  tglTransaksi: string;
  kasir: string;
  items: Array<{
    nama: string;
    qty: number;
    harga: number;
    subtotal: number;
  }>;
  subtotal: number;
  diskon: number;
  total: number;
  metodeBayar: string;
  uangDiterima?: number;
  kembalian?: number;
  namaKlinik?: string;
  alamat?: string;
  noHp?: string;
  footer?: string;
}

export function usePrint() {
  const printReceipt = useCallback((data: ReceiptData) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 2px 4px;">${item.nama}</td>
          <td style="padding: 2px 4px; text-align: center;">${item.qty}</td>
          <td style="padding: 2px 4px; text-align: right;">Rp ${item.harga.toLocaleString()}</td>
          <td style="padding: 2px 4px; text-align: right;">Rp ${item.subtotal.toLocaleString()}</td>
        </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk - ${data.noTransaksi}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              margin: 0;
              padding: 16px;
              width: 80mm;
            }
            .header { text-align: center; margin-bottom: 12px; }
            .header h2 { margin: 0; font-size: 16px; }
            .header p { margin: 2px 0; font-size: 11px; color: #555; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-size: 11px; padding: 2px 4px; border-bottom: 1px solid #000; }
            td { padding: 2px 4px; }
            .right { text-align: right; }
            .center { text-align: center; }
            .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
            .footer { text-align: center; margin-top: 12px; font-size: 11px; color: #555; }
            .info { font-size: 11px; margin: 4px 0; }
            .info span { display: block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${data.namaKlinik || "VetCare Klinik Hewan"}</h2>
            <p>${data.alamat || ""}</p>
            <p>${data.noHp || ""}</p>
          </div>
          <div class="divider"></div>
          <div class="info">
            <span>No: ${data.noTransaksi}</span>
            <span>Tgl: ${data.tglTransaksi}</span>
            <span>Kasir: ${data.kasir}</span>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="center">Qty</th>
                <th class="right">Harga</th>
                <th class="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td>Subtotal</td>
              <td class="right">Rp ${data.subtotal.toLocaleString()}</td>
            </tr>
            ${data.diskon > 0 ? `<tr><td>Diskon</td><td class="right">-Rp ${data.diskon.toLocaleString()}</td></tr>` : ""}
            <tr class="total-row">
              <td>Total</td>
              <td class="right">Rp ${data.total.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Bayar</td>
              <td class="right">${data.metodeBayar.toUpperCase()}</td>
            </tr>
            ${data.uangDiterima ? `<tr><td>Uang Diterima</td><td class="right">Rp ${data.uangDiterima.toLocaleString()}</td></tr>` : ""}
            ${data.kembalian ? `<tr><td>Kembalian</td><td class="right">Rp ${data.kembalian.toLocaleString()}</td></tr>` : ""}
          </table>
          <div class="divider"></div>
          <div class="footer">
            <p>${data.footer || "Terima kasih telah mempercayakan kesehatan hewan Anda kepada kami."}</p>
          </div>
          <script>window.print();window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  return { printReceipt };
}