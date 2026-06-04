"use client";

import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  rounded?: string;
};

export default function BrandMark({
  className = "h-11 w-11",
  rounded = "rounded-[15px]",
}: BrandMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden bg-[#234B63] ${rounded} ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/brand/logo-oficial.png"
        alt=""
        width={96}
        height={96}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}
