import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Layers3 } from "lucide-react";
import { materialBrands, type MaterialBrandCategory } from "@/lib/material-brands";
import "@/material-brands.css";

const categories: ("All brands" | MaterialBrandCategory)[] = [
  "All brands",
  "Boards & panels",
  "Hardware",
  "Paint & bath",
  "Appliances & cooling",
];

export function MaterialBrands({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All brands");
  const [selectedId, setSelectedId] = useState(materialBrands[0].id);
  const shown = materialBrands.filter(
    (brand) => category === "All brands" || brand.category === category,
  );
  const selected = shown.find((brand) => brand.id === selectedId) ?? shown[0];

  return (
    <section
      className={`wrap lx-brand-library${compact ? " lx-brand-library-compact" : ""}`}
      aria-labelledby={compact ? "home-material-brands" : "material-brands"}
    >
      <div className="lx-brand-library-heading">
        <div>
          <span className="eyebrow">THE NAMES BEHIND THE DETAILS</span>
          <h2 id={compact ? "home-material-brands" : "material-brands"}>
            Good design. <em>Considered choices.</em>
          </h2>
        </div>
        <p>
          Explore familiar brands for your materials, fittings and appliances. We’ll help you narrow
          the choices around your space and budget.
        </p>
      </div>
      {!compact && (
        <div className="lx-brand-filters" role="group" aria-label="Filter brands by category">
          {categories.map((item) => (
            <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}>
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="lx-brand-library-body">
        <div className="lx-brand-grid" role="group" aria-label="Brands to discuss">
          {shown.map((brand) =>
            compact ? (
              <Link
                key={brand.id}
                to="/materials"
                hash="material-brands"
                className="lx-brand-tile"
                aria-label={`Explore ${brand.name} and our materials guide`}
              >
                <img src={brand.image} alt={brand.name} width="180" height="72" loading="lazy" />
                <span>{brand.category}</span>
              </Link>
            ) : (
              <button
                key={brand.id}
                className="lx-brand-tile"
                onClick={() => setSelectedId(brand.id)}
                aria-pressed={selected.id === brand.id}
                aria-controls="selected-material-brand"
              >
                <img src={brand.image} alt={brand.name} width="180" height="72" loading="lazy" />
                <span>{brand.category}</span>
                {selected.id === brand.id && <Check className="lx-brand-check" size={15} />}
              </button>
            ),
          )}
        </div>
        {!compact && (
          <div className="lx-brand-detail" id="selected-material-brand" aria-live="polite">
            <Layers3 size={25} strokeWidth={1.4} aria-hidden="true" />
            <span className="eyebrow">{selected.category}</span>
            <h3>{selected.name}, in your project.</h3>
            <p>{selected.detail}</p>
            <div className="lx-brand-question">
              <strong>Make it specific.</strong>
              <p>{selected.question}</p>
            </div>
            <Link
              to="/callback"
              search={{ material: selected.name }}
              className="button lx-brand-discuss"
            >
              Discuss {selected.name}
            </Link>
            <a href={selected.website} target="_blank" rel="noopener noreferrer">
              Explore the brand’s range
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        )}
      </div>
      <div className="lx-brand-library-note">
        <p>
          Final brands, models and availability are confirmed in your approved quotation. Brand
          names and logos identify options to discuss; they do not imply an authorised partnership.
        </p>
        {compact && (
          <Link to="/materials" hash="material-brands" className="button secondary">
            Explore materials & brands
          </Link>
        )}
      </div>
    </section>
  );
}
