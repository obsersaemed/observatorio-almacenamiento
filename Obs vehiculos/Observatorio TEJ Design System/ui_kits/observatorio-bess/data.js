/* Observatorio BESS — sample data (4 real projects from the source dashboard). */
window.BESS_DATA = {
  kpis: [
    { label: 'Potencia total instalada [MW]', value: '67,0' },
    { label: 'Capacidad total [MWh]', value: '57,8' },
    { label: 'Proyectos en operación', value: '3' },
    { label: 'Proyectos registrados', value: '4' },
  ],
  projects: [
    { nombre: 'Canadian solar', operador: 'Air-e', estado: 'susp', fpo: '2019', dpto: 'Atlántico', municipio: 'Barranquilla', tec: 'Li-ion', cap: '45', mw: '50', lat: 10.9685, lng: -74.7813 },
    { nombre: 'La Martina', operador: 'Erco', estado: 'op', fpo: '2025', dpto: 'Cundinamarca', municipio: 'Paratebueno', tec: 'Li-ion', cap: '6,9', mw: '9', lat: 4.3766, lng: -73.2064 },
    { nombre: 'BESS Termozipa', operador: 'Enel-Emgesa', estado: 'op', fpo: '2021', dpto: 'Cundinamarca', municipio: 'Tocancipá', tec: 'Li-ion', cap: '3,9', mw: '7', lat: 4.9066, lng: -73.9116 },
    { nombre: 'Celsia Solar Palmira 2', operador: 'Celsia', estado: 'op', fpo: '2024', dpto: 'Valle del Cauca', municipio: 'Palmira', tec: 'Li-ion', cap: '2', mw: '1', lat: 3.5394, lng: -76.3036 },
  ],
  statusColor: { op: '#2e9b4e', con: '#ef9f2e', plan: '#9aa0a6', susp: '#e2413a' },
};
