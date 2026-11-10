import React from 'react';
import { Navigation } from 'lucide-react';

export default function IndiaRouteMap({ activeTransfers = [] }) {
  const NODES = {
    'depot-north': { name: 'Gurugram Hub', city: 'Delhi NCR', x: 190, y: 140, color: '#E11D48' },
    'depot-east': { name: 'Kolkata Depot', city: 'West Bengal', x: 380, y: 245, color: '#1F8A5B' },
    'depot-south': { name: 'Chennai Center', city: 'Tamil Nadu', x: 250, y: 390, color: '#B7791F' },
    'vendor-pune': { name: 'Apex (Pune)', city: 'Maharashtra', x: 160, y: 300, color: '#5B5BD6' },
    'vendor-ahmedabad': { name: 'BioGuard (AMD)', city: 'Gujarat', x: 135, y: 230, color: '#E11D48' }
  };

  const LANES = [
    {
      id: 'lane-n-s',
      from: 'depot-north',
      to: 'depot-south',
      label: 'NH 44 Corridor (~2,180 km • 3-4 days)',
      d: 'M 190 140 Q 210 260 250 390'
    },
    {
      id: 'lane-e-s',
      from: 'depot-east',
      to: 'depot-south',
      label: 'NH 16 East Coast (~1,670 km • 2-3 days)',
      d: 'M 380 245 Q 310 320 250 390'
    },
    {
      id: 'lane-n-e',
      from: 'depot-north',
      to: 'depot-east',
      label: 'NH 19 Trunk (~1,520 km • 2-3 days)',
      d: 'M 190 140 Q 285 190 380 245'
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3E3E8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48] border border-[#F3E3E8]">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1F1720]">
              Inter-Depot Freight Corridors
            </h3>
            <p className="text-xs text-[#8A8190]">
              Active road movement across Golden Quadrilateral and NH 44 Expressway networks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F6EF] text-[#1F8A5B] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F8A5B]" />
            <span>GPS Tracking Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* SVG Route Visualization */}
        <div className="lg:col-span-7 bg-[#FFF5F7] border border-[#F3E3E8] rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
          <svg viewBox="0 0 500 460" className="w-full h-auto max-h-[340px]">
            {/* Outline subtle map background lines */}
            <path
              d="M 120 180 L 190 110 L 250 90 L 300 130 L 390 200 L 410 270 L 350 330 L 260 420 L 220 440 L 210 370 L 150 330 L 110 260 Z"
              fill="rgba(225, 29, 72, 0.02)"
              stroke="#F3E3E8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Connecting highway lanes */}
            {LANES.map(lane => (
              <g key={lane.id}>
                <path
                  d={lane.d}
                  fill="none"
                  stroke="#F3E3E8"
                  strokeWidth="3"
                />
                <path
                  d={lane.d}
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  opacity="0.8"
                />
              </g>
            ))}

            {/* Nodes */}
            {Object.entries(NODES).map(([key, node]) => (
              <g key={key} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r="10"
                  fill="#FFFFFF"
                  stroke={node.color}
                  strokeWidth="2.5"
                />
                <circle
                  r="4"
                  fill={node.color}
                />
                <text
                  x="14"
                  y="4"
                  fill="#1F1720"
                  fontSize="11"
                  fontWeight="600"
                  className="select-none font-sans"
                >
                  {node.name}
                </text>
                <text
                  x="14"
                  y="16"
                  fill="#8A8190"
                  fontSize="9"
                  className="select-none font-sans"
                >
                  {node.city}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Lane Status Table & Transit Times */}
        <div className="lg:col-span-5 space-y-3">
          <h4 className="text-xs font-semibold text-[#1F1720]">
            Corridor Specifications &amp; Road ETAs
          </h4>

          <div className="p-3.5 rounded-xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F1720]">Gurugram ↔ Chennai</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8]">
                NH 44 Corridor
              </span>
            </div>
            <div className="text-xs text-[#8A8190]">Distance: ~2,180 km · Transit: 3-4 days by road</div>
            <div className="text-[11px] text-[#8A8190]">
              Carrier: VRL Bharat Freightways (Reefer Multi-axle)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F1720]">Chennai ↔ Gurugram</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8]">
                Cold-Chain Priority
              </span>
            </div>
            <div className="text-xs text-[#8A8190]">Distance: ~2,180 km · Reefer Transit: 3-4 days by road</div>
            <div className="text-[11px] text-[#8A8190]">
              Carrier: GatiShakti Express Logistics
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F1720]">Kolkata ↔ Chennai</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8]">
                NH 16 East Coast
              </span>
            </div>
            <div className="text-xs text-[#8A8190]">Distance: ~1,670 km · Transit: 2-3 days by road</div>
            <div className="text-[11px] text-[#8A8190]">
              Carrier: TCI Supply Chain Solutions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
