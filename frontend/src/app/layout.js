import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistema de Inventario",
  description: "Sistema de gestión de inventario con facturación",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
