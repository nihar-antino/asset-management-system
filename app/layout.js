import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Asset Registry",
  description: "IT equipment tracking for laptops, phones, and other assets",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex bg-bg text-ink">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
