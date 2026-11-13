import Image from "next/image";

export function ScholarMascot({ size = 72, className = "" }: { size?: number; className?: string }) {
  return <Image src="/arkibo-owl.webp" alt="" width={size} height={size} className={`scholar-mascot shrink-0 object-contain ${className}`} style={{ width: size, height: size }} />;
}
