// VIVITA Materials — Carbon Design System reskin
// Each function returns one screen artboard.

const { useState } = React;

// ─── Tiny primitives ──────────────────────────────────────────────────────────

const Icon16 = ({ name, color, style }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: 16,
      height: 16,
      backgroundColor: color || "currentColor",
      WebkitMaskImage: `url(icons/16/${name}.svg)`,
      maskImage: `url(icons/16/${name}.svg)`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      flexShrink: 0,
      ...style,
    }}
  />
);

const Icon32 = ({ name, color, size = 16, style }) => (
  <span
    aria-hidden="true"
    style={{
      display: "inline-block",
      width: size,
      height: size,
      backgroundColor: color || "currentColor",
      WebkitMaskImage: `url(icons/32/${name}.svg)`,
      maskImage: `url(icons/32/${name}.svg)`,
      WebkitMaskSize: "contain",
      maskSize: "contain",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      flexShrink: 0,
      ...style,
    }}
  />
);

// Search icon doesn't exist at 16, so use the 32 path scaled
const SearchIcon = ({ size = 16, color }) => (
  <Icon32 name="search" size={size} color={color} />
);

const STATUS = {
  pending: { bg: "var(--yellow-10)", fg: "var(--yellow-70)", border: "var(--yellow-30)", label: "Pending" },
  approved: { bg: "var(--green-10)", fg: "var(--green-70)", border: "var(--green-30)", label: "Approved" },
  declined: { bg: "var(--red-10)", fg: "var(--red-70)", border: "var(--red-30)", label: "Declined" },
};

// ─── Shared header ────────────────────────────────────────────────────────────

function ProductHeader({ user = "User", role = "Basic", pending = 0 }) {
  const navItems = ["Room map", "Materials", "Requests"];
  const activeIdx = role === "Staff" ? -1 : 0;
  return (
    <header
      style={{
        display: "flex",
        alignItems: "stretch",
        height: 48,
        background: "var(--gray-100)",
        color: "var(--white)",
        borderBottom: "1px solid var(--gray-90)",
      }}
    >
      <button style={hdrIconBtn}>
        <Icon16 name="menu" color="var(--white)" />
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderRight: "1px solid var(--gray-90)",
          fontSize: 14,
        }}
      >
        <span style={{ fontWeight: 600, letterSpacing: "0.16px" }}>VIVITA</span>
        <span style={{ color: "var(--gray-30)" }}>Materials</span>
      </div>
      {role !== "Staff" && (
        <nav style={{ display: "flex" }}>
          {navItems.map((l, i) => (
            <a
              key={l}
              href="#"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                color: i === activeIdx ? "var(--white)" : "var(--gray-30)",
                textDecoration: "none",
                fontSize: 14,
                borderBottom:
                  i === activeIdx ? "3px solid var(--blue-50)" : "3px solid transparent",
                marginBottom: -1,
              }}
            >
              {l}
            </a>
          ))}
        </nav>
      )}
      <div style={{ flex: 1 }} />
      {pending > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            fontSize: 12,
            color: "var(--gray-30)",
            borderLeft: "1px solid var(--gray-90)",
          }}
        >
          <Icon16 name="information" color="var(--yellow-30)" />
          <span>{pending} pending</span>
        </div>
      )}
      <button style={hdrIconBtn}>
        <SearchIcon size={20} color="var(--white)" />
      </button>
      <button style={hdrIconBtn}>
        <Icon16 name="notification" color="var(--white)" />
      </button>
      <button style={hdrIconBtn}>
        <Icon16 name="help" color="var(--white)" />
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          borderLeft: "1px solid var(--gray-90)",
          fontSize: 12,
          color: "var(--gray-30)",
        }}
      >
        <Icon32 name="user--avatar" size={20} color="var(--white)" />
        <span style={{ color: "var(--white)" }}>{user}</span>
        <span
          style={{
            fontSize: 11,
            padding: "1px 8px",
            background:
              role === "Staff" ? "var(--purple-70)" : "var(--blue-70)",
            color: "var(--white)",
            letterSpacing: "0.32px",
            textTransform: "uppercase",
          }}
        >
          {role === "Staff" ? "Admin" : "User"}
        </span>
      </div>
    </header>
  );
}

const hdrIconBtn = {
  width: 48,
  height: 48,
  background: "transparent",
  border: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--white)",
};

// ─── Buttons ──────────────────────────────────────────────────────────────────

function CdsButton({ kind = "primary", icon, children, size = 48, full, style, onClick }) {
  const kinds = {
    primary: { background: "var(--blue-60)", color: "var(--white)", border: 0 },
    secondary: { background: "var(--gray-80)", color: "var(--white)", border: 0 },
    tertiary: {
      background: "transparent",
      color: "var(--blue-60)",
      boxShadow: "inset 0 0 0 1px var(--blue-60)",
      border: 0,
    },
    ghost: { background: "transparent", color: "var(--blue-60)", border: 0 },
    danger: { background: "var(--red-60)", color: "var(--white)", border: 0 },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        height: size,
        padding: "0 16px",
        minWidth: full ? 0 : 120,
        width: full ? "100%" : "auto",
        borderRadius: 0,
        fontFamily: "inherit",
        fontSize: 14,
        lineHeight: 1,
        cursor: "pointer",
        ...kinds[kind],
        ...style,
      }}
    >
      <span>{children}</span>
      {icon && (
        <Icon32
          name={icon}
          size={16}
          color={
            kind === "primary" || kind === "secondary" || kind === "danger"
              ? "var(--white)"
              : "var(--blue-60)"
          }
        />
      )}
    </button>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────

function Tag({ color = "gray", children }) {
  const c = {
    gray: ["var(--gray-20)", "var(--gray-90)"],
    blue: ["var(--blue-20)", "var(--blue-80)"],
    green: ["var(--green-20)", "var(--green-80)"],
    red: ["var(--red-20)", "var(--red-80)"],
    yellow: ["var(--yellow-20)", "var(--yellow-80)"],
    purple: ["var(--purple-20)", "var(--purple-80)"],
    teal: ["var(--teal-20)", "var(--teal-80)"],
    cyan: ["var(--cyan-20)", "var(--cyan-80)"],
    magenta: ["var(--magenta-20)", "var(--magenta-80)"],
  }[color] || ["var(--gray-20)", "var(--gray-90)"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: 24,
        padding: "0 8px",
        background: c[0],
        color: c[1],
        borderRadius: 999,
        fontSize: 12,
        letterSpacing: "0.16px",
        fontWeight: 400,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ─── 1. LOGIN ────────────────────────────────────────────────────────────────

function LoginScreen() {
  return (
    <div
      style={{
        width: 1280,
        height: 800,
        background: "var(--gray-10)",
        display: "grid",
        gridTemplateColumns: "1fr 480px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Left: brand panel */}
      <div
        style={{
          background: "var(--blue-60)",
          color: "var(--white)",
          padding: "64px 64px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background video */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
        {/* Blue tint overlay to keep brand color reading */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(15,98,254,0.55) 0%, rgba(0,29,108,0.78) 100%)",
            zIndex: 0,
          }}
        />
        {/* Decorative lines — Carbon expressive */}
        <svg
          viewBox="0 0 800 800"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.12,
            zIndex: 0,
          }}
        >
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={i * 80}
              x2="800"
              y2={i * 80 + 200}
              stroke="white"
              strokeWidth="1"
            />
          ))}
        </svg>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 14, letterSpacing: "0.16px", marginBottom: 16, opacity: 0.85 }}>
            VIVITA / Materials
          </div>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 300,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.96px",
              maxWidth: 520,
            }}
          >
            Inventory, organized<br/>by where it lives.
          </h1>
          <p
            style={{
              marginTop: 24,
              fontSize: 16,
              lineHeight: 1.5,
              opacity: 0.85,
              maxWidth: 460,
            }}
          >
            Track materials across floors and compartments. Request what you
            need, approve what makes sense, keep the workshop running.
          </p>
        </div>

        <div style={{ position: "relative", zIndex: 1, fontSize: 12, opacity: 0.7, letterSpacing: "0.32px" }}>
          v2.4.0 &nbsp;·&nbsp; © 2026 VIVITA
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          background: "var(--white)",
          padding: "80px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8, letterSpacing: "0.16px" }}>
            Sign in
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 300,
              margin: 0,
              lineHeight: 1.25,
              color: "var(--text-primary)",
            }}
          >
            Welcome back
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Field label="Username" value="Admin" />
          <Field label="Password" value="••••" type="password" />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -12 }}>
            <a href="#" style={{ fontSize: 14, color: "var(--link-primary)" }}>
              Forgot password?
            </a>
          </div>
          <CdsButton kind="primary" icon="arrow--right" full>
            Continue
          </CdsButton>
        </div>

        <div style={{ borderTop: "1px solid var(--border-subtle-01)", paddingTop: 24 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.32px",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 12,
            }}
          >
            Demo accounts
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={demoChip}>User / pass</button>
            <button style={demoChip}>Admin / pass</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const demoChip = {
  flex: 1,
  height: 40,
  background: "var(--white)",
  border: "1px solid var(--border-subtle-00)",
  borderRadius: 0,
  fontFamily: "inherit",
  fontSize: 14,
  color: "var(--text-secondary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

function Field({ label, value, type = "text" }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div
        style={{
          height: 48,
          background: "var(--field-01)",
          borderBottom: "1px solid var(--border-strong-01)",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          color: "var(--text-primary)",
          fontFamily: type === "password" ? "var(--font-mono)" : "inherit",
          letterSpacing: type === "password" ? "0.32em" : "normal",
        }}
      >
        {value}
      </div>
    </label>
  );
}

// ─── 2. USER ROOM MAP ────────────────────────────────────────────────────────

// Hotspot regions calibrated to the CAD plan (% of image w×h: 1132×877)
const FLOOR_1 = [
  { id: "c1", n: "1A", name: "Tinkering Studio", x: 17, y: 41, w: 47, h: 35, color: "var(--cyan-20)" },
  { id: "c2", n: "1B", name: "Library", x: 17, y: 78, w: 19, h: 18, color: "var(--purple-20)" },
  { id: "c3", n: "2A", name: "ViviStudio (Photography)", x: 67, y: 47, w: 16, h: 23, color: "var(--yellow-20)" },
  { id: "c4", n: "2B", name: "White Space", x: 83, y: 67, w: 14, h: 23, color: "var(--orange-20)" },
  { id: "c5", n: "3A", name: "Roof Terrace", x: 53, y: 14, w: 30, h: 24, color: "var(--green-20)" },
  { id: "c6", n: "3B", name: "Shelving Bay", x: 36, y: 78, w: 30, h: 14, color: "var(--magenta-20)" },
];

function FloorPlan({ selected = "c1", interactive = false, onSelect }) {
  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "var(--white)",
        border: "1px solid var(--border-subtle-01)",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* CAD plan */}
      <img
        src="floorplan.png"
        alt="Floor 1 plan"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          filter: "saturate(0.9)",
        }}
      />
      {/* Hotspot overlays */}
      {FLOOR_1.map((c) => {
        const isSel = c.id === selected;
        return (
          <div
            key={c.id}
            onClick={() => onSelect && onSelect(c.id)}
            style={{
              position: "absolute",
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.w}%`,
              height: `${c.h}%`,
              background: isSel
                ? "rgba(15,98,254,0.18)"
                : `color-mix(in srgb, ${c.color} 55%, transparent)`,
              border: isSel
                ? "2px solid var(--blue-60)"
                : "1px solid var(--gray-70)",
              padding: 8,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              cursor: interactive ? "pointer" : "default",
              mixBlendMode: "multiply",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gray-100)", letterSpacing: "0.32px", background: "var(--white)", padding: "2px 6px", alignSelf: "flex-start" }}>
              {c.n}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-100)", background: "var(--white)", padding: "2px 6px", alignSelf: "flex-start", maxWidth: "100%" }}>
              {c.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserMapScreen() {
  return (
    <div style={{ width: 1280, height: 800, background: "var(--gray-10)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <ProductHeader user="Aiden Tan" role="Basic" />
      {/* Tab bar */}
      <div style={{ background: "var(--white)", borderBottom: "1px solid var(--border-subtle-01)", display: "flex", paddingLeft: 24 }}>
        {["Room map", "Materials", "My requests"].map((l, i) => (
          <div
            key={l}
            style={{
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 400,
              color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: i === 0 ? "2px solid var(--blue-60)" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>
        {/* Map area */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                Workshop · Building A
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 0", lineHeight: 1.2 }}>
                Floor 1
              </h2>
            </div>
            <div style={{ display: "flex", gap: 0 }}>
              {["Floor 1", "Floor 2"].map((f, i) => (
                <button
                  key={f}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    background: i === 0 ? "var(--gray-100)" : "var(--white)",
                    color: i === 0 ? "var(--white)" : "var(--text-primary)",
                    border: "1px solid var(--gray-100)",
                    borderRadius: 0,
                    fontFamily: "inherit",
                    fontSize: 14,
                    cursor: "pointer",
                    marginLeft: i === 0 ? 0 : -1,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <FloorPlan selected="c1" />
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ letterSpacing: "0.32px", textTransform: "uppercase" }}>Legend</span>
            <Legend swatch="var(--cyan-20)" label="Tinkering" />
            <Legend swatch="var(--purple-20)" label="Library" />
            <Legend swatch="var(--yellow-20)" label="Photography" />
            <Legend swatch="var(--orange-20)" label="White space" />
            <Legend swatch="var(--green-20)" label="Roof terrace" />
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--font-mono)" }}>6 zones · 18 SKUs</span>
          </div>
        </div>

        {/* Right: selected compartment panel */}
        <aside
          style={{
            background: "var(--white)",
            borderLeft: "1px solid var(--border-subtle-01)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle-01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px" }}>
                1A · Floor 1
              </span>
              <span style={{ flex: 1 }} />
              <Tag color="cyan">Open plan</Tag>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 400, margin: 0, lineHeight: 1.3 }}>
              Tinkering Studio
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "8px 0 0" }}>
              Open-plan workshop. VIVI-shelving on perimeter walls. Restocked weekly.
            </p>
          </div>

          <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border-subtle-01)", fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px", textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
            <span>Items in compartment</span>
            <span>3 of 3</span>
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {[
              { name: "Adhesive Tape", desc: "Heavy-duty, double-sided", qty: 18, unit: "pcs", status: "ok" },
              { name: "Mounting Putty", desc: "Removable, 2 oz", qty: 4, unit: "pcs", status: "low" },
              { name: "Hot-glue Sticks", desc: "11mm, clear, 12-pack", qty: 0, unit: "pcs", status: "out" },
            ].map((m, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border-subtle-01)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  background: i === 0 ? "var(--background-selected)" : "transparent",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{m.desc}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                    {m.qty} {m.unit}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {m.status === "ok" && <Tag color="green">In stock</Tag>}
                  {m.status === "low" && <Tag color="yellow">Low</Tag>}
                  {m.status === "out" && <Tag color="red">Out</Tag>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle-01)" }}>
            <CdsButton kind="primary" icon="add" full>
              Request material
            </CdsButton>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Legend({ swatch, hatch, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 12,
          height: 12,
          background: hatch
            ? "repeating-linear-gradient(45deg, var(--red-20) 0 4px, var(--red-10) 4px 8px)"
            : swatch,
          border: hatch ? "1px dashed var(--red-60)" : "1px solid var(--gray-60)",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

// ─── 3. ADMIN — REQUESTS ─────────────────────────────────────────────────────

function AdminRequestsScreen() {
  const requests = [
    { id: "RQ-1042", who: "Aiden Tan", item: "Adhesive Tape", qty: 4, reason: "For sign-making workshop on Sat.", time: "2 min ago", status: "pending" },
    { id: "RQ-1041", who: "Maya Chen", item: "Power Drill", qty: 1, reason: "Workshop demo with grade 7 cohort.", time: "18 min ago", status: "pending" },
    { id: "RQ-1040", who: "Jordan Lee", item: "Wood Planks", qty: 12, reason: "Skateboard ramp build, week 3.", time: "44 min ago", status: "pending" },
    { id: "RQ-1039", who: "Priya Shah", item: "Paint Cans", qty: 2, reason: "Mural touch-up on north wall.", time: "1 hr ago", status: "approved" },
    { id: "RQ-1038", who: "Felix Wong", item: "Safety Gloves", qty: 6, reason: "Replacement set for tool team.", time: "2 hr ago", status: "approved" },
    { id: "RQ-1037", who: "Aiden Tan", item: "Power Drill", qty: 3, reason: "—", time: "4 hr ago", status: "declined" },
    { id: "RQ-1036", who: "Maya Chen", item: "Screws", qty: 200, reason: "Restock for tool wall.", time: "Yesterday", status: "approved" },
    { id: "RQ-1035", who: "Jordan Lee", item: "Hot-glue Sticks", qty: 24, reason: "Out of stock, ASAP.", time: "Yesterday", status: "pending" },
  ];
  return (
    <div style={{ width: 1280, height: 800, background: "var(--gray-10)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <ProductHeader user="Sara Lim" role="Staff" pending={4} />
      <AdminTabs active="requests" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 24, gap: 16, minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Material requests
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 0", lineHeight: 1.2 }}>
              Pending review
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <CdsButton kind="tertiary" icon="filter">Filter</CdsButton>
            <CdsButton kind="primary" icon="checkmark">Bulk approve</CdsButton>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 0, alignItems: "center", height: 40, background: "var(--white)", border: "1px solid var(--border-subtle-01)" }}>
          {[
            { id: "all", label: "All", n: 8, active: false },
            { id: "pending", label: "Pending", n: 4, active: true },
            { id: "approved", label: "Approved", n: 3, active: false },
            { id: "declined", label: "Declined", n: 1, active: false },
          ].map((f) => (
            <button
              key={f.id}
              style={{
                height: "100%",
                padding: "0 16px",
                fontFamily: "inherit",
                fontSize: 14,
                background: f.active ? "var(--gray-100)" : "transparent",
                color: f.active ? "var(--white)" : "var(--text-primary)",
                border: 0,
                borderRight: "1px solid var(--border-subtle-01)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {f.label}
              <span style={{ opacity: 0.7, fontFamily: "var(--font-mono)" }}>{f.n}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", padding: "0 16px", borderLeft: "1px solid var(--border-subtle-01)", height: "100%", gap: 8 }}>
            <SearchIcon size={16} color="var(--text-secondary)" />
            <input
              defaultValue=""
              placeholder="Search by ID, requester, or material…"
              style={{
                border: 0,
                outline: "none",
                fontFamily: "inherit",
                fontSize: 14,
                width: 280,
                color: "var(--text-primary)",
                background: "transparent",
              }}
            />
          </div>
        </div>

        {/* Data table */}
        <div style={{ background: "var(--white)", border: "1px solid var(--border-subtle-01)", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1.4fr 80px 1.6fr 120px 240px",
              padding: "0 24px",
              height: 48,
              borderBottom: "1px solid var(--border-subtle-01)",
              alignItems: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-primary)",
              background: "var(--gray-10)",
            }}
          >
            <span>ID</span>
            <span>Requester</span>
            <span>Material</span>
            <span style={{ textAlign: "right" }}>Qty</span>
            <span>Reason</span>
            <span>Submitted</span>
            <span>Status / actions</span>
          </div>
          <div style={{ overflow: "auto" }}>
            {requests.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 1.4fr 80px 1.6fr 120px 240px",
                  padding: "0 24px",
                  height: 56,
                  borderBottom: "1px solid var(--border-subtle-01)",
                  alignItems: "center",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  background: i === 0 ? "var(--blue-10)" : "var(--white)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>{r.id}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={r.who} />
                  {r.who}
                </span>
                <span style={{ fontWeight: 600 }}>{r.item}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.qty}</span>
                <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.reason}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{r.time}</span>
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  {r.status === "pending" ? (
                    <>
                      <button style={tableActionBtn("primary")}>
                        <Icon32 name="checkmark" size={14} color="var(--white)" />
                        Approve
                      </button>
                      <button style={tableActionBtn("ghost")}>
                        Decline
                      </button>
                    </>
                  ) : (
                    <Tag color={r.status === "approved" ? "green" : "red"}>
                      {r.status === "approved" ? "Approved" : "Declined"}
                    </Tag>
                  )}
                </span>
              </div>
            ))}
          </div>
          {/* Footer / pagination */}
          <div
            style={{
              borderTop: "1px solid var(--border-subtle-01)",
              padding: "0 24px",
              height: 48,
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              color: "var(--text-secondary)",
              background: "var(--gray-10)",
            }}
          >
            <span>1–8 of 8 items</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--font-mono)" }}>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function tableActionBtn(kind) {
  if (kind === "primary") {
    return {
      height: 32,
      padding: "0 12px",
      background: "var(--blue-60)",
      color: "var(--white)",
      border: 0,
      borderRadius: 0,
      fontFamily: "inherit",
      fontSize: 13,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    };
  }
  return {
    height: 32,
    padding: "0 12px",
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-strong-01)",
    borderRadius: 0,
    fontFamily: "inherit",
    fontSize: 13,
    cursor: "pointer",
  };
}

function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const palette = ["var(--blue-60)", "var(--purple-60)", "var(--teal-60)", "var(--magenta-60)", "var(--cyan-60)"];
  const color = palette[name.length % palette.length];
  return (
    <span
      style={{
        display: "inline-flex",
        width: 24,
        height: 24,
        borderRadius: 999,
        background: color,
        color: "var(--white)",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.16px",
      }}
    >
      {initials}
    </span>
  );
}

function AdminTabs({ active }) {
  const tabs = [
    { id: "editor", label: "Floor plan editor" },
    { id: "requests", label: "Requests", badge: 4 },
    { id: "overview", label: "Overview" },
  ];
  return (
    <div
      style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--border-subtle-01)",
        display: "flex",
        paddingLeft: 24,
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            fontSize: 14,
            color: t.id === active ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: t.id === active ? "2px solid var(--blue-60)" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: t.id === active ? 600 : 400,
          }}
        >
          {t.label}
          {t.badge && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                background: "var(--yellow-30)",
                color: "var(--yellow-100)",
                padding: "1px 6px",
                borderRadius: 999,
                fontWeight: 600,
                letterSpacing: "0.16px",
              }}
            >
              {t.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── 4. ADMIN — OVERVIEW ─────────────────────────────────────────────────────

function AdminOverviewScreen() {
  const stats = [
    { label: "Total materials", value: "47", sub: "across 6 compartments", trend: "+3 this week", color: "var(--blue-60)" },
    { label: "Stock items", value: "1,238", sub: "individual units", trend: "−24 this week", color: "var(--teal-60)" },
    { label: "Compartments", value: "8", sub: "across 2 floors", trend: "0 change", color: "var(--purple-60)" },
    { label: "Pending requests", value: "4", sub: "awaiting response", trend: "Oldest: 4 hr ago", color: "var(--yellow-30)" },
    { label: "Out of stock", value: "2", sub: "needs restock", trend: "Hot-glue, Putty", color: "var(--red-60)" },
    { label: "Approval rate", value: "82%", sub: "last 30 days", trend: "+4% vs prior", color: "var(--green-50)" },
  ];

  const compartments = [
    { code: "1A", name: "Storage A", floor: "Floor 1", items: 8, color: "var(--cyan-20)", mats: [{n:"Wood Planks",q:45,u:"pcs",s:"ok"},{n:"Screws M6",q:500,u:"pcs",s:"ok"},{n:"Hinges, brass",q:24,u:"pcs",s:"ok"}] },
    { code: "1B", name: "Storage B", floor: "Floor 1", items: 5, color: "var(--red-20)", mats: [{n:"Paint Cans",q:12,u:"pcs",s:"ok"},{n:"Primer",q:3,u:"L",s:"low"},{n:"Brushes",q:9,u:"pcs",s:"ok"}] },
    { code: "2A", name: "Workshop", floor: "Floor 1", items: 12, color: "var(--yellow-20)", mats: [{n:"Workbench clamps",q:6,u:"pcs",s:"ok"},{n:"Cutting mats",q:4,u:"pcs",s:"ok"},{n:"Vise grips",q:2,u:"pcs",s:"low"}] },
    { code: "2B", name: "Tools", floor: "Floor 1", items: 7, color: "var(--orange-20)", mats: [{n:"Power Drill",q:3,u:"pcs",s:"ok"},{n:"Safety Gloves",q:25,u:"pcs",s:"ok"},{n:"Hex keys",q:4,u:"sets",s:"ok"}] },
    { code: "3A", name: "Materials", floor: "Floor 1", items: 3, color: "var(--purple-20)", mats: [{n:"Adhesive Tape",q:18,u:"pcs",s:"ok"},{n:"Mounting Putty",q:4,u:"pcs",s:"low"},{n:"Hot-glue Sticks",q:0,u:"pcs",s:"out"}] },
    { code: "3B", name: "Equipment", floor: "Floor 1", items: 6, color: "var(--cyan-20)", mats: [{n:"Soldering iron",q:2,u:"pcs",s:"ok"},{n:"Multimeter",q:1,u:"pcs",s:"low"},{n:"Wire spool",q:5,u:"pcs",s:"ok"}] },
  ];

  return (
    <div style={{ width: 1280, height: 800, background: "var(--gray-10)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <ProductHeader user="Sara Lim" role="Staff" pending={4} />
      <AdminTabs active="overview" />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Inventory at a glance
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 400, margin: "4px 0 0", lineHeight: 1.2 }}>
              Overview
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <CdsButton kind="tertiary" icon="document">Export CSV</CdsButton>
            <CdsButton kind="primary" icon="add">Add material</CdsButton>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: "var(--border-subtle-01)", marginBottom: 24, border: "1px solid var(--border-subtle-01)" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--white)", padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 16, background: s.color }} />
                <span style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 300, lineHeight: 1.1, color: "var(--text-primary)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.3 }}>
                {s.sub}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-helper)", fontFamily: "var(--font-mono)", letterSpacing: "0.16px" }}>
                {s.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Out-of-stock banner */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 16px",
            background: "var(--yellow-10)",
            borderLeft: "3px solid var(--yellow-30)",
            marginBottom: 24,
          }}
        >
          <Icon32 name="warning--filled" size={20} color="var(--yellow-30)" style={{ marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
              2 items out of stock
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Hot-glue Sticks (3A · Materials) and Mounting Putty trending low. Consider restocking before Saturday workshops.
            </div>
          </div>
          <a href="#" style={{ fontSize: 14, color: "var(--link-primary)" }}>View items</a>
        </div>

        {/* Compartment grid */}
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <h3 style={{ fontSize: 20, fontWeight: 400, margin: 0 }}>Materials by compartment</h3>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px", textTransform: "uppercase" }}>
            Floor 1 · 6 compartments
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {compartments.map((c) => (
            <div
              key={c.code}
              style={{
                background: "var(--white)",
                border: "1px solid var(--border-subtle-01)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  background: c.color,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: "1px solid var(--gray-30)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    background: "var(--white)",
                    color: "var(--gray-100)",
                    padding: "2px 8px",
                    letterSpacing: "0.32px",
                  }}
                >
                  {c.code}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--gray-100)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--gray-80)" }}>{c.floor}</div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gray-90)" }}>
                  {c.items} SKUs
                </span>
              </div>
              <div>
                {c.mats.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      borderBottom: i === c.mats.length - 1 ? 0 : "1px solid var(--border-subtle-01)",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ flex: 1, color: "var(--text-primary)" }}>{m.n}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: m.s === "out" ? "var(--red-60)" : "var(--text-secondary)", marginRight: 8 }}>
                      {m.q} {m.u}
                    </span>
                    {m.s === "out" && <Tag color="red">Out</Tag>}
                    {m.s === "low" && <Tag color="yellow">Low</Tag>}
                    {m.s === "ok" && <Tag color="green">OK</Tag>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 5. ADMIN — FLOOR PLAN EDITOR ────────────────────────────────────────────

function AdminEditorScreen() {
  const tools = [
    { icon: "add", label: "Compartment", color: "var(--cyan-30)" },
    { icon: "document", label: "Out of bounds", color: "var(--red-30)" },
    { icon: "home", label: "Stairs", color: "var(--gray-40)" },
    { icon: "home", label: "Lift", color: "var(--gray-30)" },
  ];

  return (
    <div style={{ width: 1280, height: 800, background: "var(--gray-10)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <ProductHeader user="Sara Lim" role="Staff" pending={4} />
      <AdminTabs active="editor" />

      {/* Sub-toolbar */}
      <div
        style={{
          background: "var(--white)",
          borderBottom: "1px solid var(--border-subtle-01)",
          padding: "0 24px",
          height: 48,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px", textTransform: "uppercase" }}>
            Editing
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Floor 1</span>
          <Icon16 name="chevron--down" color="var(--text-secondary)" />
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-subtle-01)" }} />
        <div style={{ display: "flex", gap: 0, height: 32 }}>
          {tools.map((t) => (
            <button
              key={t.label}
              style={{
                height: 32,
                padding: "0 12px",
                background: t.label === "Compartment" ? "var(--gray-100)" : "var(--white)",
                color: t.label === "Compartment" ? "var(--white)" : "var(--text-primary)",
                border: "1px solid var(--border-subtle-01)",
                borderRadius: 0,
                fontFamily: "inherit",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginRight: -1,
              }}
            >
              <span style={{ width: 10, height: 10, background: t.color, border: "1px solid var(--gray-60)" }} />
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          Last saved 2 minutes ago
        </span>
        <CdsButton kind="tertiary" size={32} icon="close">Discard</CdsButton>
        <CdsButton kind="primary" size={32} icon="save">Save changes</CdsButton>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", minHeight: 0 }}>
        {/* Canvas */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", minHeight: 0, gap: 12 }}>
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <FloorPlan selected="c1" interactive />
            {/* Selection handles on c5 */}
            <Handles />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ letterSpacing: "0.32px", textTransform: "uppercase" }}>Zoom</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>100%</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: "var(--font-mono)" }}>x: 30, y: 42, w: 30, h: 25</span>
          </div>
        </div>

        {/* Right inspector */}
        <aside style={{ background: "var(--white)", borderLeft: "1px solid var(--border-subtle-01)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle-01)" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px", textTransform: "uppercase", marginBottom: 8 }}>
              Selected · Compartment
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 400, margin: 0 }}>3A · Materials</h3>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <InspectorField label="Number" value="3A" mono />
            <InspectorField label="Name" value="Materials" />
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", marginBottom: 8 }}>
                Color
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["var(--cyan-20)","var(--red-20)","var(--yellow-20)","var(--orange-20)","var(--purple-20)","var(--green-20)"].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      width: 32,
                      height: 32,
                      background: c,
                      border: i === 4 ? "2px solid var(--blue-60)" : "1px solid var(--gray-40)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <InspectorField label="X" value="30" mono />
              <InspectorField label="Y" value="42" mono />
              <InspectorField label="Width" value="30" mono />
              <InspectorField label="Height" value="25" mono />
            </div>

            <div style={{ borderTop: "1px solid var(--border-subtle-01)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 8 }}>
                Materials in this compartment
              </div>
              {[
                { n: "Adhesive Tape", q: "18 pcs" },
                { n: "Mounting Putty", q: "4 pcs" },
                { n: "Hot-glue Sticks", q: "0 pcs" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid var(--border-subtle-01)", fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{m.n}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{m.q}</span>
                </div>
              ))}
              <button style={{ ...demoChip, marginTop: 12, height: 32, fontSize: 13 }}>
                <Icon32 name="add" size={14} color="var(--blue-60)" />
                Add material
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-subtle-01)", display: "flex" }}>
            <CdsButton kind="danger" icon="trash-can" full size={48}>
              Delete
            </CdsButton>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InspectorField({ label, value, mono }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div
        style={{
          height: 40,
          background: "var(--field-01)",
          borderBottom: "1px solid var(--border-strong-01)",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </label>
  );
}

function Handles() {
  const positions = [
    { left: "30%", top: "42%" },
    { left: "60%", top: "42%" },
    { left: "30%", top: "67%" },
    { left: "60%", top: "67%" },
    { left: "45%", top: "42%" },
    { left: "45%", top: "67%" },
    { left: "30%", top: "54.5%" },
    { left: "60%", top: "54.5%" },
  ];
  return (
    <>
      {positions.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: p.left,
            top: p.top,
            width: 10,
            height: 10,
            background: "var(--white)",
            border: "1.5px solid var(--blue-60)",
            transform: "translate(-50%, -50%)",
            zIndex: 5,
          }}
        />
      ))}
    </>
  );
}

// ─── 6. USER — REQUEST DIALOG ────────────────────────────────────────────────

function RequestDialogScreen() {
  return (
    <div style={{ width: 1280, height: 800, background: "var(--gray-10)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* dimmed background */}
      <div style={{ filter: "blur(0px)", opacity: 1 }}>
        <UserMapScreenInner />
      </div>
      {/* scrim */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />

      {/* modal */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          background: "var(--white)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border-subtle-01)", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.32px", textTransform: "uppercase", marginBottom: 4 }}>
              New material request
            </div>
            <h3 style={{ fontSize: 24, fontWeight: 400, margin: 0, lineHeight: 1.25 }}>
              Adhesive Tape
            </h3>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              3A · Materials · Floor 1 · 18 pcs available
            </div>
          </div>
          <button style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer" }}>
            <Icon32 name="close" size={20} color="var(--text-primary)" />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <InspectorField label="Quantity (max 18)" value="4" mono />
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.32px", color: "var(--text-secondary)" }}>
              Reason
            </span>
            <div
              style={{
                minHeight: 96,
                padding: "12px",
                background: "var(--field-01)",
                borderBottom: "1px solid var(--border-strong-01)",
                fontSize: 14,
                color: "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              For sign-making workshop on Saturday. Need ~4 rolls to mount displays in the front room.
            </div>
            <span style={{ fontSize: 12, color: "var(--text-helper)", textAlign: "right" }}>
              82 / 280
            </span>
          </label>

          <div style={{ background: "var(--blue-10)", borderLeft: "3px solid var(--blue-70)", padding: "12px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon16 name="information" color="var(--blue-70)" style={{ marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.4 }}>
              Requests are usually reviewed within 30 minutes during workshop hours.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", borderTop: "1px solid var(--border-subtle-01)" }}>
          <CdsButton kind="secondary" full size={64} style={{ flex: 1, justifyContent: "flex-start" }}>
            Cancel
          </CdsButton>
          <CdsButton kind="primary" icon="checkmark" full size={64} style={{ flex: 1, justifyContent: "space-between" }}>
            Submit request
          </CdsButton>
        </div>
      </div>
    </div>
  );
}

function UserMapScreenInner() {
  return <UserMapScreen />;
}

// ─── Export ───────────────────────────────────────────────────────────────────

Object.assign(window, {
  LoginScreen,
  UserMapScreen,
  AdminRequestsScreen,
  AdminOverviewScreen,
  AdminEditorScreen,
  RequestDialogScreen,
});
