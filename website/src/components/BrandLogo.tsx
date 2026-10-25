import artwork from "@/assets/luxe-brand-source.png";

/** Frames the owner's original artwork without redrawing the wordmark or skyline. */
export function BrandLogo({
  inverse = false,
  className = "",
}: {
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={`luxe-brand-logo${inverse ? " luxe-brand-logo-inverse" : ""} ${className}`}>
      <img src={artwork} width="1125" height="680" alt="Luxe Infra" decoding="async" />
    </span>
  );
}
