export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg className="h-10 w-10 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad-maroon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B1928" />
            <stop offset="100%" stopColor="#A82025" />
          </linearGradient>
          <linearGradient id="grad-red" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D62227" />
            <stop offset="100%" stopColor="#F37021" />
          </linearGradient>
          <linearGradient id="grad-orange" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F37021" />
            <stop offset="100%" stopColor="#FED000" />
          </linearGradient>
          <linearGradient id="grad-yellow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FED000" />
            <stop offset="100%" stopColor="#7B1928" />
          </linearGradient>
        </defs>

        {/* Center circle */}
        <circle cx="50" cy="50" r="14" fill="#FED000" />

        {/* Interlocking curved paths with gradients */}
        <path d="M 50,22 A 28,28 0 0,1 78,50" stroke="url(#grad-red)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 78,50 A 28,28 0 0,1 50,78" stroke="url(#grad-orange)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 50,78 A 28,28 0 0,1 22,50" stroke="url(#grad-yellow)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 22,50 A 28,28 0 0,1 50,22" stroke="url(#grad-maroon)" strokeWidth="12" strokeLinecap="round" />

        {/* Circular heads representing people */}
        <circle cx="30" cy="30" r="8" fill="url(#grad-maroon)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="70" cy="30" r="8" fill="url(#grad-red)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="70" cy="70" r="8" fill="url(#grad-orange)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="30" cy="70" r="8" fill="url(#grad-yellow)" stroke="#ffffff" strokeWidth="2" />
      </svg>
      <div>
        <strong className="block text-lg font-black leading-none text-stone-900">Cesol<span className="text-cesol-800">Brief</span></strong>
        <span className="text-xs font-semibold text-stone-500">Briefings criativos</span>
      </div>
    </div>
  );
}
