/**
 * Onboarding diagram for the Data API enable screen (Neon Console style).
 * Browser window ↔ HTTPS ↔ database table with a highlighted row.
 */
export function DataApiEnableDiagram() {
  return (
    <div
      className="w-full max-w-xl rounded-xl border border-border/80 bg-muted/30 px-6 py-5"
      aria-hidden
    >
      <svg
        viewBox="0 0 480 132"
        className="mx-auto h-auto w-full max-w-[480px] text-foreground"
        role="img"
        aria-label="Browser connects over HTTPS to Neon database"
      >
        <defs>
          <marker
            id="data-api-arrow-start"
            markerWidth="6"
            markerHeight="6"
            refX="0"
            refY="3"
            orient="auto"
          >
            <path d="M6 0 L0 3 L6 6" fill="none" stroke="currentColor" strokeWidth="1" />
          </marker>
          <marker
            id="data-api-arrow-end"
            markerWidth="6"
            markerHeight="6"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" strokeWidth="1" />
          </marker>
        </defs>

        {/* Browser label */}
        <text
          x="72"
          y="14"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-medium"
        >
          Browser
        </text>

        {/* Browser window */}
        <g transform="translate(8, 22)">
          <rect
            x="0"
            y="0"
            width="128"
            height="88"
            rx="8"
            className="fill-background stroke-border"
            strokeWidth="1"
          />
          {/* Title bar controls */}
          <path
            d="M14 18 L10 14 L14 10"
            fill="none"
            className="stroke-muted-foreground/70"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 18 L26 14 L22 10"
            fill="none"
            className="stroke-muted-foreground/70"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M38 9.5 A4.5 4.5 0 1 1 34.2 16.2"
            fill="none"
            className="stroke-muted-foreground/70"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path
            d="M34 9 L34.2 12.2 L37.2 11.5"
            fill="none"
            className="stroke-muted-foreground/70"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Address bar */}
          <rect
            x="50"
            y="9"
            width="68"
            height="10"
            rx="5"
            className="fill-muted/80 stroke-border/60"
            strokeWidth="0.75"
          />
          {/* Content area divider */}
          <line x1="0" y1="28" x2="128" y2="28" className="stroke-border" strokeWidth="1" />
          <rect x="12" y="40" width="104" height="40" rx="2" className="fill-muted/20" />
        </g>

        {/* HTTPS connector */}
        <text
          x="240"
          y="58"
          textAnchor="middle"
          className="fill-muted-foreground text-[10px] font-medium tracking-wide"
        >
          HTTPS
        </text>
        <line
          x1="148"
          y1="68"
          x2="332"
          y2="68"
          className="stroke-muted-foreground/50"
          strokeWidth="1"
          strokeDasharray="4 3"
          markerStart="url(#data-api-arrow-start)"
          markerEnd="url(#data-api-arrow-end)"
        />

        {/* Database label */}
        <text
          x="408"
          y="14"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px] font-medium"
        >
          Database
        </text>

        {/* Database table */}
        <g transform="translate(336, 22)">
          <rect
            x="0"
            y="0"
            width="136"
            height="88"
            rx="8"
            className="fill-background stroke-border"
            strokeWidth="1"
          />
          {/* Column headers */}
          <text x="28" y="22" textAnchor="middle" className="fill-muted-foreground text-[9px]">
            ID
          </text>
          <text x="88" y="22" textAnchor="middle" className="fill-muted-foreground text-[9px]">
            Name
          </text>
          <line x1="0" y1="30" x2="136" y2="30" className="stroke-border/80" strokeWidth="1" />

          {/* Data rows */}
          <DataApiTableRow y={38} idWidth={20} nameWidth={52} />
          <DataApiTableRow y={50} idWidth={16} nameWidth={44} />
          <g>
            {/* Highlighted row */}
            <rect
              x="6"
              y="58"
              width="124"
              height="14"
              rx="3"
              fill="none"
              className="stroke-primary"
              strokeWidth="1.25"
              strokeDasharray="3 2"
            />
            <rect x="14" y="62" width={18} height={6} rx="2" className="fill-muted-foreground/35" />
            <rect x="52" y="62" width={48} height={6} rx="2" className="fill-muted-foreground/35" />
          </g>
          <DataApiTableRow y={76} idWidth={22} nameWidth={56} />
        </g>
      </svg>
    </div>
  )
}

function DataApiTableRow({
  y,
  idWidth,
  nameWidth,
}: {
  y: number
  idWidth: number
  nameWidth: number
}) {
  return (
    <g>
      <rect x="14" y={y} width={idWidth} height={6} rx="2" className="fill-muted-foreground/35" />
      <rect x="52" y={y} width={nameWidth} height={6} rx="2" className="fill-muted-foreground/35" />
    </g>
  )
}
