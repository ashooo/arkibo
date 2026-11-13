"use client";

import Image from "next/image";
import { useState } from "react";
import { Briefcase, GraduationCap, Megaphone, Wallet } from "lucide-react";

const icons = { scholarship: GraduationCap, allowance: Wallet, spes: Briefcase };

export function NoticePreview({ src, category }: { src: string | null; category?: keyof typeof icons }) {
  const [failed, setFailed] = useState(false);
  const Icon = category ? icons[category] : Megaphone;

  return (
    <div className="relative isolate mx-2 mt-2 grid aspect-[3/1] min-h-0 place-items-center overflow-hidden rounded-xl bg-[#dceafa] p-2 dark:bg-[#203b58]">
      {src && !failed && (
        <Image src={src} alt="" fill unoptimized referrerPolicy="no-referrer" className="pointer-events-none -z-10 scale-110 object-cover blur-2xl" />
      )}
      {src && !failed ? (
        <Image src={src} alt="" width={900} height={300} unoptimized referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full min-h-0 w-full object-contain" />
      ) : (
        <span aria-hidden="true" className="grid size-14 place-items-center rounded-2xl bg-white/60 text-[#28527c] dark:bg-white/10 dark:text-[#c2defa]">
          <Icon size={30} />
        </span>
      )}
    </div>
  );
}
