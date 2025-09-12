import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";

export const metadata: Metadata = {
  title: "OpenPOS - Point of Sale System",
  description: "Modern, user-friendly Point of Sale system with barcode scanning and receipt generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ModeProvider>
            {children}
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
