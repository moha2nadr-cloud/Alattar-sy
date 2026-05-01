import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFade(true), 3200);
    const doneTimer = setTimeout(() => onDone(), 4000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(135deg, #1a4a2e 0%, #2d7a4f 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "2rem",
      transition: "opacity 0.8s ease",
      opacity: fade ? 0 : 1,
      pointerEvents: fade ? "none" : "all",
    }}>
      <div style={{ position: "relative", width: 90, height: 90 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 18, height: 28,
            marginTop: -9, marginLeft: -9,
            animation: `orbit 2.4s linear infinite`,
            animationDelay: `${-i * (2.4 / 6)}s`,
            transformOrigin: "9px 45px",
          }}>
            <div style={{
              width: "100%", height: "100%",
              background: `hsl(${130 + i * 12}, 70%, ${60 + i * 4}%)`,
              borderRadius: "50% 10% 50% 10%",
              transform: `rotate(${i * 60}deg)`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              opacity: 0.85,
            }} />
          </div>
        ))}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 12, height: 12,
          marginTop: -6, marginLeft: -6,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 12px 4px rgba(255,255,255,0.35)",
        }} />
      </div>
      <p style={{
        color: "#ffffff", fontSize: "1.4rem",
        fontWeight: "bold", textAlign: "center",
        lineHeight: 1.8, padding: "0 2rem",
        fontFamily: "'Tajawal', system-ui, sans-serif",
        direction: "rtl",
      }}>
        أهلاً بكم في موقع<br />مركز الطب الإسلامي البديل
      </p>
      <p style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.9rem", direction: "rtl",
        fontFamily: "'Tajawal', system-ui, sans-serif",
      }}>
        الرجاء الانتظار قليلاً...
      </p>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
        @keyframes orbit {
          from { transform: rotate(0deg)   translateY(-36px) rotate(0deg); }
          to   { transform: rotate(360deg) translateY(-36px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
