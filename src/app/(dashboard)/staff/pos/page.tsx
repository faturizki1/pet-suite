"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { usePos } from "@/hooks/use-pos";
import { CatalogGrid } from "@/components/modules/pos/catalog-grid";
import { Cart } from "@/components/modules/pos/cart";
import { PaymentModalContent } from "@/components/modules/pos/payment-modal";
import { ReceiptContent } from "@/components/modules/pos/receipt";

export default function StaffPOSPage() {
  const pos = usePos();
  const [receiptData, setReceiptData] = useState<{
    noTransaksi: string;
    items: Array<{ nama: string; qty: number; harga: number; subtotal: number }>;
    subtotal: number;
    diskon: number;
    total: number;
    metodeBayar: string;
    uangDiterima?: number;
    kembalian?: number;
  } | null>(null);

  if (pos.loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="POS Kasir" subtitle="Point of Sale" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CatalogGrid
            products={pos.products}
            services={pos.services}
            search={pos.search}
            onSearchChange={pos.setSearch}
            onAddToCart={pos.addToCart}
          />
        </div>

        <Cart
          items={pos.cart}
          subtotal={pos.subtotal}
          diskon={pos.diskon}
          total={pos.total}
          onUpdateQty={pos.updateQty}
          onRemove={pos.removeFromCart}
          onDiskonChange={pos.setDiskon}
          onCheckout={() => pos.setShowPayment(true)}
        />
      </div>

      <Modal open={pos.showPayment} onClose={() => pos.setShowPayment(false)} title="Pembayaran">
        <PaymentModalContent
          total={pos.total}
          metodeBayar={pos.metodeBayar}
          uangDiterima={pos.uangDiterima}
          kembalian={pos.kembalian}
          error={pos.error}
          submitting={pos.submitting}
          onMetodeBayarChange={pos.setMetodeBayar}
          onUangDiterimaChange={pos.setUangDiterima}
          onSubmit={async () => {
            const result = await pos.submitTransaction();
            if (result) {
              setReceiptData({
                noTransaksi: result.noTransaksi,
                items: pos.cart.map((c) => ({
                  nama: c.nama,
                  qty: c.qty,
                  harga: c.harga,
                  subtotal: c.harga * c.qty - c.diskon,
                })),
                subtotal: pos.subtotal,
                diskon: pos.diskon,
                total: pos.total,
                metodeBayar: pos.metodeBayar,
                uangDiterima: pos.metodeBayar === "tunai" ? Number(pos.uangDiterima) : undefined,
                kembalian: pos.metodeBayar === "tunai" ? Math.max(0, pos.kembalian) : undefined,
              });
            }
          }}
        />
      </Modal>

      <Modal open={receiptData !== null} onClose={() => setReceiptData(null)} title="Transaksi Berhasil">
        {receiptData && (
          <ReceiptContent
            data={receiptData}
            onClose={() => setReceiptData(null)}
          />
        )}
      </Modal>
    </div>
  );
}