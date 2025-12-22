function LogoIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left bracket < */}
      <path
        d="M7 6L2 12L7 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="miter"
      />

      {/* Right bracket > */}
      <path
        d="M17 6L22 12L17 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="miter"
      />

      {/* Center pulsing dot */}
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="#22d3ee"
        className="logo-pulse-dot"
      />

      {/* Left inner arc */}
      <path
        d="M9.5 10.5C9.2 11 9 11.5 9 12C9 12.5 9.2 13 9.5 13.5"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Left outer arc */}
      <path
        d="M7.8 10C7.4 10.6 7.2 11.3 7.2 12C7.2 12.7 7.4 13.4 7.8 14"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />

      {/* Right inner arc */}
      <path
        d="M14.5 10.5C14.8 11 15 11.5 15 12C15 12.5 14.8 13 14.5 13.5"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Right outer arc */}
      <path
        d="M16.2 10C16.6 10.6 16.8 11.3 16.8 12C16.8 12.7 16.6 13.4 16.2 14"
        stroke="#22d3ee"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  )
}

export default LogoIcon
