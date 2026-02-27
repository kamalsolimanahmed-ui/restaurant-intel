import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 py-10 text-white">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © 2025 Restaurant Intel
          </p>

          {/* Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/terms"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600">|</span>
            <Link
              href="/contact"
              className="text-sm text-gray-300 transition-colors hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
