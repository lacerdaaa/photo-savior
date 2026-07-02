import { ArrowRight, Crop, Download, ImageIcon, Layers } from "lucide-react";
import { type ComponentType, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { useProjectStore } from "@/store/projectStore";

export default function LandingPage() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);

  function handleNewProject() {
    const id = createProject("Novo Projeto");
    void navigate(`/editor/${id}`);
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#07070e" }}
    >
      <GeometricBackground />

      <div className="relative z-10 min-h-screen flex flex-col justify-center px-10 md:px-20 lg:px-28">
        <div className="flex flex-col gap-7 max-w-2xl">
          <h1
            className="leading-[0.9] tracking-[-0.03em] text-white"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(4.5rem, 11vw, 9.5rem)",
            }}
          >
            Photo
            <br />
            Saviour
            <span className="text-primary">.</span>
          </h1>

          <p className="text-white/40 text-base leading-relaxed max-w-xs">
            Editor de fotos no browser. Camadas, filtros,
            crop e export — sem login, sem servidor.
          </p>

          <div className="flex items-center gap-7 mt-1">
            <button
              className="btn btn-primary rounded-lg px-7"
              onClick={handleNewProject}
            >
              Abrir editor
            </button>
            <button
              className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors duration-150 text-sm"
              onClick={() => void navigate("/projects")}
            >
              Ver projetos <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-10 md:px-20 lg:px-28 pb-9">
          <div
            className="w-full h-px mb-6"
            style={{ background: "rgba(255,255,255,0.07)" }}
          />
          <div className="flex items-center gap-2">
            {FEATURES.map((f, i) => (
              <div key={f.label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-white/25 text-xs tracking-wide">
                  <f.Icon size={12} className="" />
                  <span>{f.label}</span>
                </div>
                {i < FEATURES.length - 1 && (
                  <span className="text-white/15 mx-1">·</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeometricBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Aurora orbs — right half only */}
      <div
        className="absolute rounded-full"
        style={{
          width: 800,
          height: 800,
          top: "-30%",
          right: "-20%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)",
          filter: "blur(80px)",
          animation: "orb-drift 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          bottom: "-15%",
          right: "5%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)",
          filter: "blur(60px)",
          animation: "orb-drift 28s ease-in-out infinite reverse",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 75% 50%, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 75% 50%, black 0%, transparent 100%)",
        }}
      />

      {/* Hero cube — intentional right-side element */}
      <GeoCube
        size={200}
        containerStyle={{
          top: "50%",
          right: "12%",
          transform: "translateY(-50%)",
          animation: "float-up 14s ease-in-out infinite",
          opacity: 0.7,
        }}
        spinDuration="30s"
      />

      {/* Supporting cubes */}
      <GeoCube
        size={75}
        containerStyle={{
          top: "18%",
          right: "30%",
          animation: "float-up 9s ease-in-out infinite 1.5s",
          opacity: 0.5,
        }}
        spinDuration="18s"
      />
      <GeoCube
        size={48}
        containerStyle={{
          bottom: "22%",
          right: "32%",
          animation: "float-up 7s ease-in-out infinite 3s",
          opacity: 0.4,
        }}
        spinDuration="12s"
      />
      <GeoCube
        size={36}
        containerStyle={{
          top: "60%",
          right: "20%",
          animation: "float-up 6s ease-in-out infinite 2s",
          opacity: 0.3,
        }}
        spinDuration="9s"
      />

      {/* Floating diamonds */}
      {DIAMONDS.map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: d.size,
            height: d.size,
            top: d.top,
            right: d.right,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.01)",
            animation: `diamond-float ${d.duration} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

function GeoCube({
  size,
  containerStyle,
  spinDuration = "16s",
}: {
  size: number;
  containerStyle?: CSSProperties;
  spinDuration?: string;
}) {
  const half = size / 2;
  const faces: CSSProperties[] = [
    { transform: `translateZ(${half}px)` },
    { transform: `rotateY(180deg) translateZ(${half}px)` },
    { transform: `rotateY(90deg) translateZ(${half}px)` },
    { transform: `rotateY(-90deg) translateZ(${half}px)` },
    { transform: `rotateX(90deg) translateZ(${half}px)` },
    { transform: `rotateX(-90deg) translateZ(${half}px)` },
  ];

  return (
    <div style={{ position: "absolute", ...containerStyle }}>
      <div style={{ perspective: `${size * 5}px` }}>
        <div
          className="geo-cube"
          style={{ width: size, height: size, animationDuration: spinDuration }}
        >
          {faces.map((faceStyle, i) => (
            <div key={i} className="geo-cube-face" style={faceStyle} />
          ))}
        </div>
      </div>
    </div>
  );
}

const DIAMONDS: Array<{
  size: number;
  top: string;
  right: string;
  duration: string;
  delay: string;
}> = [
  { size: 38, top: "25%", right: "42%", duration: "8s", delay: "0s" },
  { size: 22, top: "72%", right: "38%", duration: "10s", delay: "1.5s" },
  { size: 28, top: "45%", right: "5%", duration: "7s", delay: "2s" },
];

const FEATURES: Array<{
  Icon: ComponentType<{ size: number; className: string }>;
  label: string;
}> = [
  { Icon: Layers, label: "Camadas" },
  { Icon: Crop, label: "Crop" },
  { Icon: ImageIcon, label: "Filtros" },
  { Icon: Download, label: "Export PNG/JPEG" },
];
