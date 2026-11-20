export default function EclipticBackdrop() {
  return (
    <div className="ecliptic-scene" aria-hidden="true">
      <img className="ecliptic-art ecliptic-art--orbit" src="/images/ecliptic-orbit.jpg" alt="" decoding="async" />
      <img className="ecliptic-art ecliptic-art--gradient" src="/images/hero-gradient.png" alt="" decoding="async" />
      <img className="ecliptic-art ecliptic-art--glass" src="/images/ios-glass.jpeg" alt="" decoding="async" />
      <span className="ecliptic-star ecliptic-star--one" />
      <span className="ecliptic-star ecliptic-star--two" />
      <span className="ecliptic-star ecliptic-star--three" />
      <span className="ecliptic-star ecliptic-star--four" />
      <span className="ecliptic-star ecliptic-star--five" />
      <span className="ecliptic-star ecliptic-star--six" />
      <span className="ecliptic-star ecliptic-star--seven" />
      <span className="ecliptic-star ecliptic-star--eight" />
    </div>
  );
}
