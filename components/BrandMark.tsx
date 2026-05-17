"use client";

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
      <img
        src="/brand/logo-oficial.png"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}
