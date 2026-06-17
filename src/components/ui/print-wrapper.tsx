"use client";

import { useRef } from "react";
import { Button } from "./button";
import { Printer } from "lucide-react";

interface PrintWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export function PrintWrapper({ children, title }: PrintWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${title || "Print"}</title>
          <style>
            @media print {
              body { font-family: monospace; font-size: 12px; margin: 0; padding: 16px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
              .no-print { display: none !important; }
            }
            @page { margin: 0; }
          </style>
        </head>
        <body>
          ${contentRef.current?.innerHTML || ""}
          <script>window.print();window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div>
      <div className="no-print mb-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}