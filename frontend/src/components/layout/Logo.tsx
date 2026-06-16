import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

const ASPECT = 969 / 705;

type Props = {
  className?: string;
  /** Base height in px — use className for responsive overrides */
  height?: number;
};

export default function Logo({ className, height = 72 }: Props) {
  const width = Math.round(height * ASPECT);

  return (
    <Link
      href="/"
      className={clsx("inline-flex shrink-0 items-center", className)}
    >
      <Image
        src="/tygastyle-logo-transparent.png"
        alt="TygaStyle — INTARE Y'UMUJYI"
        width={width}
        height={height}
        className="h-14 w-auto object-contain md:h-[72px]"
        priority
      />
    </Link>
  );
}
