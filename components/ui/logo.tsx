import Image from "next/image";

/** ヘッダー等で使う横並びロゴ */
export function LogoHorizontal({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/spot_logo_horizontal.svg"
      alt="SPOT"
      width={520}
      height={100}
      className={className}
      priority
    />
  );
}

/** アイコンのみ（小サイズ・ファビコン代替用途） */
export function Logomark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/spot_logomark.svg"
      alt="SPOT"
      width={280}
      height={280}
      className={className}
    />
  );
}
