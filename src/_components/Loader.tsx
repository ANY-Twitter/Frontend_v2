import { cn } from "@/lib/utils";

export default function Loader({
  width = 24,
  height = 24,
  className = "",
}: Readonly<{
  width: number;
  height: number;
  className?: string;
}>) {
  return (
    <div className="grid place-items-center h-screen">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin", className)}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );
}
