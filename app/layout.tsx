import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HiveFinder",
  description: "Your one stop shop for clubs and friends at Sacramento State!",
};

/**
 * Paints the saved theme before React mounts.
 *
 * ThemeProvider cannot do this: it runs after hydration, so the first frame
 * would always be the default green and then jump. Reading the cached copy
 * here, synchronously in <head>, removes that flash. It is wrapped in
 * try/catch because a corrupt cache must never stop the page rendering.
 */
const THEME_BOOTSTRAP = `
(function () {
  try {
    var raw = localStorage.getItem("hivefinder:theme");
    if (!raw) return;
    var p = JSON.parse(raw);
    if (!p || !p.vars) return;
    var root = document.documentElement;
    for (var k in p.vars) {
      if (/^--hf-[a-z-]+$/.test(k) && /^#[0-9a-f]{6}$/i.test(p.vars[k])) {
        root.style.setProperty(k, p.vars[k]);
      }
    }
  } catch (e) {}
})();
`;

/**
 * Header and Footer live here rather than in each page, so every route gets
 * the same chrome. Pages render only their own content.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
