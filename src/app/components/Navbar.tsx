"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Slicer" },
    { href: "/generator", label: "Generator" },
    { href: "/auto", label: "Auto Detect" },
  ];

  return (
    <nav className="w-full flex justify-center p-4 bg-gray-800">
      <div className="flex gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-lg ${
              pathname === link.href
                ? "text-white font-bold"
                : "text-gray-300 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
