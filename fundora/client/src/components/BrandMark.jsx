export default function BrandMark({ size = 'h-8 w-8' }) {
  return (
    <span className={`brand-mark ${size} grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon-green to-neon-emerald shadow-glow-green`}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-[78%] w-[78%]">
        <g fill="none" stroke="#030303" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5.5">
          <path d="M14 12v21a4 4 0 0 0 6.4 3.2L35 26" />
          <path d="m19 11 15 8.6a5 5 0 0 1 0 8.7l-13.6 7.8" />
        </g>
        <circle cx="14" cy="12" r="2.6" fill="#B6FF4A" />
        <circle cx="35" cy="26" r="2.6" fill="#B6FF4A" />
      </svg>
    </span>
  );
}
