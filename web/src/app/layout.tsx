import type { Metadata } from "next";
import { Bagel_Fat_One, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
});

const ibm = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm",
});

export const metadata: Metadata = {
  title: "AIRLOCK",
  description:
    "Two company agents work one incident. A sentence reaches the shared record only if the other side can second it, the gate allows the fields, and a human closes the record.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bagel.variable} ${ibm.variable} h-full`} data-scroll-behavior="smooth">
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
