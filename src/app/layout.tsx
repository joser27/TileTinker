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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-900 text-white retro-pattern">
        <div className="min-h-screen backdrop-blur-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
