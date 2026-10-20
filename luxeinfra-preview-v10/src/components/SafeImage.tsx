import { useState } from "react";
import { ImageOff } from "lucide-react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackLabel?: string;
};

/** An <img> that degrades to a friendly placeholder instead of a broken icon. */
export function SafeImage({ fallbackLabel = "Image unavailable", className, alt, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt ?? fallbackLabel}
        className={`flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground ${className ?? ""}`}
      >
        <ImageOff className="h-6 w-6" />
        <span className="px-3 text-center text-xs">{fallbackLabel}</span>
      </div>
    );
  }

  return <img {...props} alt={alt} className={className} onError={() => setFailed(true)} />;
}
