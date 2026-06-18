"use client";

import { useRef, useEffect } from "react";
import { Button } from "./button";
import { Printer } from "lucide-react";

interface PrintWrapperProps {
  children: React.ReactNode;
  title?: string;
  size?: "receipt" | "a4";
}

const PRINT_STYLES_ID = "vetcare-print-styles";

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLES_ID)) return;

  const style = document.createElement("style");
  style.id = PRINT_STYLES_ID;
  style.textContent = `
    @media print {
      body.vetcare-printing * {
        visibility: hidden;
      }
      body.vetcare-printing .vetcare-print-content,
      body.vetcare-printing .vetcare-print-content * {
        visibility: visible;
      }
      body.vetcare-printing .vetcare-print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      body.vetcare-printing .vetcare-no-print {
        display: none !important;
      }
      body.vetcare-printing .vetcare-print-content[data-size="receipt"] {
        max-width: 80mm;
        font-family: 'Courier New', Courier, monospace;
        font-size: 12px;
        padding: 16px;
      }
      body.vetcare-printing .vetcare-print-content[data-size="a4"] {
        max-width: 210mm;
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        padding: 20mm;
      }
      @page {
        margin: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export function PrintWrapper({ children, title, size = "receipt" }: PrintWrapperProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensurePrintStyles();
  }, []);

  function handlePrint() {
    document.body.classList.add("vetcare-printing");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("vetcare-printing");
    }, 1000);
  }

  return (
    <div>
      <div className="vetcare-no-print mb-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      <div
        ref={contentRef}
        className="vetcare-print-content"
        data-size={size}
      >
        {children}
      </div>
    </div>
  );
}