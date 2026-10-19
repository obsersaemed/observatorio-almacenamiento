/* Observatorio VE — data from the "Almacenamiento de energía en vehículos eléctricos" panel.
   Totals and shares are from the source; yearly splits per brand are illustrative. */
(function () {
  const TOTAL = 45300;
  const share = [
    ['Byd', 43.6, [0.30, 0.45, 0.25]], ['Tesla', 17.1, [0.38, 0.42, 0.20]], ['Volvo', 6.6, [0.40, 0.40, 0.20]],
    ['Chery', 5.4, [0.20, 0.50, 0.30]], ['Chevrolet', 4.8, [0.45, 0.35, 0.20]], ['Kia', 4.6, [0.35, 0.40, 0.25]],
    ['Bmw', 3.6, [0.40, 0.40, 0.20]], ['DEEPAL', 3.4, [0.10, 0.55, 0.35]], ['Peugeot', 2.1, [0.35, 0.45, 0.20]],
  ];
  const brands = share.map(([marca, pct, split]) => {
    const total = Math.round(TOTAL * pct / 100);
    const y = split.map((s) => Math.round(total * s));
    return { marca, pct, total, years: { 2024: y[0], 2025: y[1], 2026: total - y[0] - y[1] } };
  });
  window.VE_DATA = {
    totalVehiculos: TOTAL,
    totalKwh: 2.4e6,
    brands,
    otrosPct: 8.7,
    tech: [
      { label: 'LFP', pct: 85.2, potencia: 1261 },
      { label: 'Lithium-ion', pct: 10.8, potencia: 899 },
      { label: 'NMC Lithium-ion', pct: 3.3, potencia: 261 },
      { label: 'ULTIUM', pct: 0.7, potencia: 85 },
    ],
    lineas: {
      Byd: ['Dolphin', 'Seal', 'Yuan Plus', 'Song Plus'], Tesla: ['Model 3', 'Model Y'],
      Volvo: ['EX30', 'XC40'], Chery: ['Tiggo 7', 'eQ1'], Chevrolet: ['Bolt EUV', 'Equinox EV'],
      Kia: ['EV5', 'Niro EV'], Bmw: ['iX1', 'i4'], DEEPAL: ['S07', 'L07'], Peugeot: ['e-2008'],
    },
  };
})();
