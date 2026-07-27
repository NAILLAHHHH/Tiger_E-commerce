import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const ASPECT = 807 / 585;

type Props = {
  className?: string;
  /** Rendered height in px */
  height?: number;
  /** Use red-only mark that sits cleanly on dark backgrounds */
  onDark?: boolean;
};

export default function Logo({ className, height = 72, onDark = false }: Props) {
  const width = Math.round(height * ASPECT);
  const src = onDark
    ? "/tygamart-logo-on-dark.png"
    : "/tygastyle-logo-transparent.png";

  return (
    <Link
      href="/"
      className={clsx("inline-flex shrink-0 items-center", className)}
      aria-label="TygaMart home"
    >
      <Image
        src={src}
        alt="TygaMart"
        width={width}
        height={height}
        className="w-auto bg-transparent object-contain"
        style={{ height, background: "transparent" }}
        unoptimized
        priority
      />
    </Link>
  );
}
