import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { sampleTestimonials } from "@/lib/testimonials";

export function TestimonialPreview() {
  const sample = sampleTestimonials[0];
  return (
    <section className="testimonial-preview wrap" aria-labelledby="testimonial-preview-title">
      <div>
        <span className="eyebrow">THE PERSONAL SIDE OF HOME</span>
        <h2 id="testimonial-preview-title">
          Room for
          <br />
          <em>your stories.</em>
        </h2>
        <Link to="/testimonials" className="text-link">
          Explore testimonials <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="testimonial-preview-quote">
        <span className="sample-review-label">SAMPLE COPY · NOT A REAL CLIENT REVIEW</span>
        <blockquote>“{sample.quote}”</blockquote>
        <p>
          {sample.category} <span>Client attribution to follow</span>
        </p>
      </div>
    </section>
  );
}
