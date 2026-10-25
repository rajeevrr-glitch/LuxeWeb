import { ShieldCheck, BriefcaseBusiness, House } from "lucide-react";
import { businessProof } from "@/lib/business-proof";
import "@/trust.css";

export function TrustHighlights() {
  return (
    <section className="wrap luxe-trust" aria-label="LuxeInfra at a glance">
      <div className="luxe-trust-stats">
        <div>
          <BriefcaseBusiness size={25} strokeWidth={1.4} />
          <p>
            <strong>{businessProof.experienceYears}+ years</strong>
            <span>of interior experience</span>
          </p>
        </div>
        <div>
          <House size={25} strokeWidth={1.4} />
          <p>
            <strong>{businessProof.deliveredProjects}+ projects</strong>
            <span>delivered by our team</span>
          </p>
        </div>
        <div>
          <ShieldCheck size={25} strokeWidth={1.4} />
          <p>
            <strong>
              Lifetime warranty<sup>*</sup>
            </strong>
            <a href="#warranty-note">See the warranty note</a>
          </p>
        </div>
      </div>
      <p id="warranty-note" className="luxe-trust-note">
        <strong>*</strong> {businessProof.warrantyNote}
      </p>
    </section>
  );
}
