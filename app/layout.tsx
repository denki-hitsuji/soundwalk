import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
async function generateMetadata(): Promise<Metadata> {

  const title = process.env.NEXT_PUBLIC_APP_ENV === "prod"
        ? "Soundwalk"
        : `Soundwalk [${process.env.NEXT_PUBLIC_APP_ENV}]`

  const description = "街に音楽が溢れるためのアプリ";

  return {
    title,
    description,
    openGraph: {
      title,        // ✅ string
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,        // ✅ string
      description,
    },
  };
}
export const metadata: Metadata = await generateMetadata(); 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
