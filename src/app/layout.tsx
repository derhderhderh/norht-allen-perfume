import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { BagProvider } from "@/components/bag-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Toaster } from "@/components/toaster";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif"
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "North Allen Perfumery",
  description: "A local boutique for custom perfume and cologne made from your chosen fragrance notes."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-2478580166735674" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2478580166735674"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${serif.variable} ${sans.variable} min-h-screen bg-veil font-sans antialiased`}>
        <AuthProvider>
          <BagProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <Toaster />
          </BagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
