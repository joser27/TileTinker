import "./globals.css";

export const metadata = {
  title: "Sprite Cutter Tool",
  description: "A web tool to slice sprite sheets into individual images.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
