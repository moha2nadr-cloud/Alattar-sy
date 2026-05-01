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
      <div style={{
        width: 70, height: 70, borderRadius: "50%",
        border: "4px solid rgba(255,255,255,0.2)",
        borderTopColor: "#ffffff",
        animation: "spin 0.9s linear infinite",
      }} />
      <p style={{
        color: "#ffffff", fontSize: "1.4rem",
        fontWeight: "bold", textAlign: "center",
        lineHeight: 1.8, padding: "0 2rem",
        fontFamily: "system-ui, sans-serif",
        direction: "rtl",
      }}>
        أهلاً بكم في موقع<br />مركز الطب الإسلامي البديل
      </p>
      <p style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: "0.9rem", direction: "rtl",
      }}>
        الرجاء الانتظار قليلاً...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
