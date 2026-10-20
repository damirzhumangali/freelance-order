import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — работа на вашей орбите",
  description: "Реальные заказы на разработку сайтов и приложений. Найдите свой следующий проект или расскажите о вашей идее.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
