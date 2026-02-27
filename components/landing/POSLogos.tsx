export function POSLogos() {
  const logos = [
    { name: "Square", svg: <SquareLogo /> },
    { name: "Clover", svg: <CloverLogo /> },
    { name: "Toast", svg: <ToastLogo /> },
    { name: "QuickBooks", svg: <QuickBooksLogo /> },
    { name: "CSV", svg: <CSVLogo /> },
  ];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Headline */}
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Works with every POS system
        </h2>

        {/* Subtext */}
        <p className="mb-8 text-center text-sm text-gray-500">
          If it exports a CSV, we can read it.
        </p>

        {/* Logo Row */}
        <div className="flex flex-wrap items-center justify-center gap-10">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex h-10 items-center opacity-60 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
              title={logo.name}
            >
              {logo.svg}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SquareLogo() {
  return (
    <svg
      viewBox="0 0 120 40"
      height="40"
      width="auto"
      fill="currentColor"
      className="text-gray-800"
    >
      <rect x="5" y="5" width="18" height="18" rx="4" fill="#000" />
      <text x="28" y="19" fontSize="16" fontWeight="600" fill="#000">
        Square
      </text>
    </svg>
  );
}

function CloverLogo() {
  return (
    <svg
      viewBox="0 0 120 40"
      height="40"
      width="auto"
      fill="currentColor"
      className="text-gray-800"
    >
      <circle cx="14" cy="14" r="10" fill="#228800" />
      <text x="28" y="19" fontSize="16" fontWeight="600" fill="#228800">
        Clover
      </text>
    </svg>
  );
}

function ToastLogo() {
  return (
    <svg
      viewBox="0 0 120 40"
      height="40"
      width="auto"
      fill="currentColor"
      className="text-gray-800"
    >
      <rect x="4" y="8" width="20" height="12" rx="2" fill="#FF4D4D" />
      <text x="28" y="19" fontSize="16" fontWeight="600" fill="#FF4D4D">
        Toast
      </text>
    </svg>
  );
}

function QuickBooksLogo() {
  return (
    <svg
      viewBox="0 0 140 40"
      height="40"
      width="auto"
      fill="currentColor"
      className="text-gray-800"
    >
      <rect x="4" y="6" width="20" height="20" rx="4" fill="#2CA01C" />
      <text x="28" y="19" fontSize="14" fontWeight="600" fill="#2CA01C">
        QuickBooks
      </text>
    </svg>
  );
}

function CSVLogo() {
  return (
    <svg
      viewBox="0 0 80 40"
      height="40"
      width="auto"
      fill="currentColor"
      className="text-gray-800"
    >
      <rect x="4" y="6" width="18" height="22" rx="2" fill="#217346" />
      <text x="8" y="21" fontSize="10" fontWeight="600" fill="white">
        CSV
      </text>
    </svg>
  );
}
