export function Testimonials() {
  const testimonials = [
    {
      quote: "Saved $2,400 in first month",
      name: "Marco Rossi",
      location: "Toronto, Canada",
    },
    {
      quote: "Finally understand my labor costs",
      name: "Sarah Chen",
      location: "Portland, OR",
    },
    {
      quote: "Cut waste. Kept the good stuff.",
      name: "James Murphy",
      location: "Dublin, Ireland",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-[32px]">
          Trusted by Restaurant Owners
        </h2>

        {/* Testimonial Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col rounded-xl bg-gray-100 p-8"
            >
              <p className="mb-6 flex-grow text-lg font-bold text-gray-900">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {testimonial.name}
                </p>
                <p className="text-[13px] text-gray-600">
                  {testimonial.location}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
