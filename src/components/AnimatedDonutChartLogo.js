import React from 'react';

const AnimatedDonutChartLogo = () => {
  return (
    <div
      style={{
        width: '40px', // Tetap ini defaultnya
        height: '40px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out', // Transisi untuk efek membesar
      }}
      className="new-animated-logo-container" // Kelas unik untuk kontainer
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            .new-animated-logo-container:hover {
              transform: scale(1.2); /* Memperbesar logo saat hover */
            }

            /* Definisi keyframes untuk animasi donut */
            @keyframes spinLoop {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            /* Definisi keyframes untuk animasi bar */
            @keyframes barAnimateLoop {
              0% { height: 20; y: 90; }
              50% { height: 80; y: 60; }
              100% { height: 40; y: 80; }
            }

            /* Atur animasi secara default (berhenti) */
            .new-animated-logo-container .donut-group {
              animation: spinLoop 2s linear infinite paused; /* paused secara default */
              transform-origin: 100px 100px; /* Pastikan origin transform ada di sini */
            }

            .new-animated-logo-container .bar-1 {
              animation: barAnimateLoop 1.8s infinite alternate ease-in-out paused;
            }
            .new-animated-logo-container .bar-2 {
              animation: barAnimateLoop 2.2s infinite alternate ease-in-out paused;
              animation-delay: 0.2s;
            }
            .new-animated-logo-container .bar-3 {
              animation: barAnimateLoop 1.9s infinite alternate ease-in-out paused;
              animation-delay: 0.4s;
            }

            /* Atur animasi agar berjalan saat hover */
            .new-animated-logo-container:hover .donut-group {
              animation-play-state: running !important;
            }
            .new-animated-logo-container:hover .bar-1,
            .new-animated-logo-container:hover .bar-2,
            .new-animated-logo-container:hover .bar-3 {
              animation-play-state: running !important;
            }
          `}
        </style>

        {/* Grup untuk menampung semua bagian donat agar bisa berputar bersama */}
        {/* Style transformOrigin dipindahkan ke CSS untuk konsistensi dengan animasi */}
        <g className="donut-group"> 
          {/* Bagian Donat 1 (Oranye) */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke="#FF8C00" // Warna Oranye
            strokeWidth="30"
            strokeDasharray="178 534" // 1/3 keliling lingkaran
            transform="rotate(-90 100 100)"
          />
          {/* Bagian Donat 2 (Hitam) */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke="#222222" // Warna Hitam
            strokeWidth="30"
            strokeDasharray="178 534" // 1/3 keliling lingkaran
            transform="rotate(30 100 100)"
          />
          {/* Bagian Donat 3 (Abu-abu) */}
          <circle
            cx="100"
            cy="100"
            r="85"
            stroke="#A9A9A9" // Warna Abu-abu
            strokeWidth="30"
            strokeDasharray="178 534" // 1/3 keliling lingkaran
            transform="rotate(150 100 100)"
          />
        </g>
        
        {/* Chart Batang di Tengah (3 bagian & lebih tegas) */}
        <g className="bar-group">
          <rect className="bar bar-1" x="70" y="80" width="18" height="40" rx="4" fill="#222222" />
          <rect className="bar bar-2" x="91" y="60" width="18" height="80" rx="4" fill="#FF8C00" />
          <rect className="bar bar-3" x="112" y="70" width="18" height="60" rx="4" fill="#222222" />
        </g>
      </svg>
    </div>
  );
};

export default AnimatedDonutChartLogo;