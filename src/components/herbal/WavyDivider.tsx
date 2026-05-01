export function WavyDivider({ angle = "60" }: { angle?: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -top-24 left-0 z-0 h-72 w-[160%] origin-top-right text-primary/10" style={{ rotate: `${angle}deg` }}>
      <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="h-full w-full">
        <path d="M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,100 L1440,0 L0,0 Z" fill="currentColor" opacity="0.8" />
        <path d="M0,140 C240,220 480,60 720,140 C960,220 1200,60 1440,140" fill="none" stroke="currentColor" strokeOpacity="0.9" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
