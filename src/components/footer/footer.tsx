import Link from "next/link";

// Server Component — pure rendering, zero client JS
const LINKS = [
  { label: "Protocol", href: "/protocol" },
  { label: "Blog", href: "/blog" },
  { label: "Genesis", href: "/genesis" },
  { label: "GitHub", href: "https://github.com/myshapeprotocol", external: true },
  { label: "X", href: "https://x.com/myshapeprotocol", external: true },
];

export default function ProtocolFooter() {
  return (
    <footer className="relative z-10 w-full bg-transparent font-mono py-12">
      <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-6">
        {/* Links */}
        <div className="flex items-center gap-6">
          {LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 text-[10px] tracking-[0.2em] uppercase hover:text-white/50 transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="text-white/20 text-[10px] tracking-[0.2em] uppercase hover:text-white/50 transition-colors"
              >
                {l.label}
              </Link>
            ),
          )}
        </div>

        {/* Copyright */}
        <span className="text-white/10 text-[8px] tracking-[0.2em] uppercase">
          &copy; {new Date().getFullYear()} MyShape Protocol
        </span>
      </div>
    </footer>
  );
}
