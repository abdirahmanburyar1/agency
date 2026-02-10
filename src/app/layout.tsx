import type { Metadata } from "next";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { getSystemSettings } from "@/lib/system-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { systemName, faviconUrl } = await getSystemSettings();
    return {
      title: systemName,
      description: "Travel agency management - tickets, visas, receivables & payables",
      icons: { icon: faviconUrl },
    };
  } catch {
    return {
      title: "Daybah Travel Agency",
      description: "Travel agency management - tickets, visas, receivables & payables",
      icons: { icon: "/favicon.png" },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
