export function HowItWorks() {
  const steps = [
    {
      icon: "📊",
      title: "Upload 3 Files",
      description: "Sales, labor, expenses. From any POS system.",
    },
    {
      icon: "⚡",
      title: "We Analyse",
      description: "Math runs. AI writes. 30 seconds.",
    },
    {
      icon: "💰",
      title: "Save Money",
      description: "One clear action. This week. This month.",
    },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-[32px]">
          How It Works
        </h2>

        {/* Steps Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-left">
              <div className="mb-4 text-5xl">{step.icon}</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
