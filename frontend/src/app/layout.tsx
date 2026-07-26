import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Manrope, Pirata_One } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/utils";

const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontPirata = Pirata_One({
  subsets: ["latin"],
  variable: "--font-pirata",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Anirom",
  description: "Streaming de Animes com qualidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable,
          fontPirata.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
