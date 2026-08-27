import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { GlobalSearch } from "@/components/global-search";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة حجوزات الطيران",
  description: "نظام داخلي لإدارة حجوزات الطيران لشركة سياحة وسفر",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-40 flex items-center border-b bg-background/95 px-4 py-2 backdrop-blur lg:top-0">
                <GlobalSearch />
              </header>
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-4 md:p-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
