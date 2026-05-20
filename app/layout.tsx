import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:       "AI Science Learning Assistant — by Gideon Bams",
  description: "Ask any science question and get clear explanations with interactive quizzes. Built by Gideon Bams, powered by AI.",
  keywords:    ["science", "learning", "AI", "education", "quiz", "Gideon Bams"],
  authors:     [{ name: "Gideon Bams" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#050818] font-sans text-white">
        {children}
      </body>
    </html>
  );
}
