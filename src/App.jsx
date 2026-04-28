import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const SECTIONS = ["home", "about", "services", "sectors", "programs", "contact"];
const navTR = { home: "Ana Sayfa", about: "Hakkımızda", services: "Hizmetler", sectors: "Sektörler", programs: "Destek Programları", contact: "İletişim" };

function useInView(t = 0.1) {
  const r = useRef(null);
  const [v, s] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { s(true); o.unobserve(el); } }, { threshold: t });
    o.observe(el);
    return () => o.disconnect();
  }, [t]);
  return [r, v];
}

function Anim({ children, d = 0 }) {
  const [r, v] = useInView(0.06);
  return (
    <div ref={r} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
      transition: `all 0.7s cubic-bezier(.22,1,.36,1) ${d}s`,
    }}>{children}</div>
  );
}

/* ═══ COUNTER ═══ */
function StatCard({ end, suffix, prefix, label }) {
  const [count, setCount] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [ref, isVisible] = useInView(0.15);
  const num = parseInt(end.replace(/[^0-9]/g, ""));
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isVisible || hasRun.current) return;
    hasRun.current = true;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * num));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, num]);

  return (
    <div ref={ref} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ textAlign: "center", padding: "48px 20px", cursor: "default", transition: "all 0.5s cubic-bezier(.22,1,.36,1)", transform: hovered ? "scale(1.06) translateY(-4px)" : "scale(1)", position: "relative" }}>
      <div style={{ position: "absolute", inset: -1, borderRadius: 20, background: hovered ? "linear-gradient(135deg, rgba(10,186,181,0.08), rgba(43,58,103,0.05))" : "transparent", transition: "all 0.6s" }} />
      <div style={{
        fontFamily: "'Outfit'", fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1, position: "relative",
        background: hovered ? "linear-gradient(135deg, #0ABAB5, #2B3A67)" : "linear-gradient(135deg, #0ABAB5, #0ABAB5)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        transition: "all 0.6s", filter: hovered ? "drop-shadow(0 0 20px rgba(10,186,181,0.3))" : "none",
      }}>{prefix || ""}{count}{suffix || ""}</div>
      <div style={{ fontFamily: "'Inter'", fontSize: 13, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: hovered ? "#0ABAB5" : "#999", marginTop: 14, position: "relative", transition: "all 0.5s" }}>{label}</div>
    </div>
  );
}

/* ═══ 3D HERO ═══ */
function HeroCanvas() {
  const mount = useRef(null), mouse = useRef({ x: 0, y: 0 }), raf = useRef(null);
  useEffect(() => {
    const c = mount.current;
    if (!c) return;
    const W = c.clientWidth, H = c.clientHeight;
    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(W, H); ren.setPixelRatio(Math.min(window.devicePixelRatio, 2)); ren.setClearColor(0x000000, 0);
    c.appendChild(ren.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    cam.position.set(0, 0, 38);
    const T = new THREE.Color(0x0abab5), N = new THREE.Color(0x2b3a67), W2 = new THREE.Color(0x4a9ead);
    const l1 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(9, 0)), new THREE.LineBasicMaterial({ color: T, transparent: true, opacity: 0.14 })); scene.add(l1);
    const l2 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(6.5, 1)), new THREE.LineBasicMaterial({ color: T, transparent: true, opacity: 0.24 })); scene.add(l2);
    const l3 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(3.8, 1)), new THREE.LineBasicMaterial({ color: N, transparent: true, opacity: 0.4 })); scene.add(l3);
    const l4 = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.8, 0)), new THREE.LineBasicMaterial({ color: T, transparent: true, opacity: 0.55 })); scene.add(l4);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshBasicMaterial({ color: T, transparent: true, opacity: 0.18 })); scene.add(glow);
    const PC = 280;
    const pGeo = new THREE.BufferGeometry(), pos = new Float32Array(PC * 3), col = new Float32Array(PC * 3), sz = new Float32Array(PC), pd = [];
    for (let i = 0; i < PC; i++) {
      const sh = Math.random(), radius = sh < 0.3 ? 8 + Math.random() * 4 : sh < 0.6 ? 14 + Math.random() * 6 : 22 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta); pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); pos[i * 3 + 2] = radius * Math.cos(phi);
      const cc = sh < 0.4 ? T : sh < 0.7 ? N : W2;
      col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
      sz[i] = 1.5 + Math.random() * 2;
      pd.push({ radius, theta, phi, speed: 0.0002 + Math.random() * 0.0007, drift: (Math.random() - 0.5) * 0.0003 });
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3)); pGeo.setAttribute("size", new THREE.BufferAttribute(sz, 1));
    const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `attribute float size; varying vec3 vC; void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*(240./-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vC; void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;float a=(1.-smoothstep(0.,.5,d))*.65;gl_FragColor=vec4(vC,a);}`,
    }); scene.add(new THREE.Points(pGeo, pMat));
    const ML = 120, la = new Float32Array(ML * 6), lca = new Float32Array(ML * 6), lG = new THREE.BufferGeometry();
    lG.setAttribute("position", new THREE.BufferAttribute(la, 3)); lG.setAttribute("color", new THREE.BufferAttribute(lca, 3)); lG.setDrawRange(0, 0);
    scene.add(new THREE.LineSegments(lG, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending })));
    const rings = [];
    for (let r = 0; r < 4; r++) { const rr = 8 + r * 4.5; const ring = new THREE.Mesh(new THREE.RingGeometry(rr - 0.015, rr + 0.015, 180), new THREE.MeshBasicMaterial({ color: r % 2 === 0 ? T : N, transparent: true, opacity: 0.06, side: THREE.DoubleSide })); ring.rotation.x = Math.PI / 3 + r * 0.4; ring.rotation.y = r * 0.55; rings.push({ mesh: ring, bx: ring.rotation.x, spd: 0.025 + r * 0.012 }); scene.add(ring); }
    const onMM = (e) => { mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1; };
    window.addEventListener("mousemove", onMM);
    const onR = () => { const w = c.clientWidth, h = c.clientHeight; cam.aspect = w / h; cam.updateProjectionMatrix(); ren.setSize(w, h); };
    window.addEventListener("resize", onR);
    let t = 0;
    const anim = () => { raf.current = requestAnimationFrame(anim); t += 0.005;
      const mx = mouse.current.x, my = mouse.current.y;
      cam.position.x += (mx * 5 - cam.position.x) * 0.012; cam.position.y += (my * 4 - cam.position.y) * 0.012; cam.lookAt(0, 0, 0);
      l1.rotation.x = t * 0.08 + my * 0.15; l1.rotation.y = t * 0.06 + mx * 0.15;
      l2.rotation.x = t * 0.12 + my * 0.25; l2.rotation.y = t * 0.15 + mx * 0.25;
      l3.rotation.x = -t * 0.18 + my * 0.2; l3.rotation.y = -t * 0.12 + mx * 0.2;
      l4.rotation.x = t * 0.4; l4.rotation.y = t * 0.3; l4.rotation.z = t * 0.2;
      glow.material.opacity = 0.14 + Math.sin(t * 1.8) * 0.08; glow.scale.setScalar(1 + Math.sin(t * 1.2) * 0.25);
      const pa = pGeo.attributes.position.array;
      for (let i = 0; i < PC; i++) { const d = pd[i]; d.theta += d.speed; d.phi += d.drift; pa[i * 3] = d.radius * Math.sin(d.phi) * Math.cos(d.theta); pa[i * 3 + 1] = d.radius * Math.sin(d.phi) * Math.sin(d.theta) + Math.sin(t * 0.8 + i * 0.1) * 0.5; pa[i * 3 + 2] = d.radius * Math.cos(d.phi); }
      pGeo.attributes.position.needsUpdate = true;
      let li = 0; const lpa = lG.attributes.position.array, lcaa = lG.attributes.color.array;
      for (let i = 0; i < PC && li < ML; i++) { for (let j = i + 1; j < PC && li < ML; j++) { const dx = pa[i*3]-pa[j*3], dy = pa[i*3+1]-pa[j*3+1], dz = pa[i*3+2]-pa[j*3+2]; const dist = Math.sqrt(dx*dx+dy*dy+dz*dz); if (dist < 5.5) { const idx = li * 6; lpa[idx]=pa[i*3];lpa[idx+1]=pa[i*3+1];lpa[idx+2]=pa[i*3+2];lpa[idx+3]=pa[j*3];lpa[idx+4]=pa[j*3+1];lpa[idx+5]=pa[j*3+2]; const a=1-dist/5.5; lcaa[idx]=T.r*a;lcaa[idx+1]=T.g*a;lcaa[idx+2]=T.b*a;lcaa[idx+3]=T.r*a;lcaa[idx+4]=T.g*a;lcaa[idx+5]=T.b*a; li++; } } }
      lG.setDrawRange(0, li * 2); lG.attributes.position.needsUpdate = true; lG.attributes.color.needsUpdate = true;
      rings.forEach(r => { r.mesh.rotation.x = r.bx + t * r.spd; r.mesh.rotation.z = Math.sin(t * 0.25) * 0.08; });
      ren.render(scene, cam);
    }; anim();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMM); window.removeEventListener("resize", onR); ren.dispose(); if (c.contains(ren.domElement)) c.removeChild(ren.domElement); };
  }, []);
  return (<div ref={mount} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />);
}

const Logo = ({ s = 40 }) => (<svg width={s} height={s} viewBox="0 0 100 100" fill="none"><line x1="50" y1="8" x2="50" y2="92" stroke="#0ABAB5" strokeWidth="4.5" strokeLinecap="round" /><line x1="14" y1="29" x2="86" y2="71" stroke="#2B3A67" strokeWidth="4.5" strokeLinecap="round" /><line x1="86" y1="29" x2="14" y2="71" stroke="#0ABAB5" strokeWidth="4.5" strokeLinecap="round" /><line x1="18" y1="50" x2="82" y2="50" stroke="#2B3A67" strokeWidth="4.5" strokeLinecap="round" /></svg>);

const sectors = [
  { title: "Enerji", desc: "Yenilenebilir enerji, enerji verimliliği ve sürdürülebilir enerji projeleri" },
  { title: "EV Şarj İstasyonları", desc: "Elektrikli araç şarj altyapısı ve akıllı şarj ağı çözümleri" },
  { title: "Tarım", desc: "Modern tarım teknolojileri, akıllı tarım ve sürdürülebilir gıda üretimi" },
  { title: "Hayvancılık", desc: "Hayvancılık projeleri, çiftlik modernizasyonu ve verimlilik artırma" },
  { title: "Girişimcilik", desc: "Start-up destekleri, inovasyon programları ve girişimcilik ekosistemi" },
  { title: "Teknoloji Üretimi", desc: "Ar-Ge projeleri, teknoloji geliştirme ve yüksek katma değerli üretim" },
  { title: "Sanayi", desc: "Sanayi yatırımları, üretim tesisi modernizasyonu ve kapasite artırımı" },
  { title: "KOBİ", desc: "Küçük ve orta ölçekli işletmelere özel hibe ve destek programları" },
  { title: "Dernekler & Kamu", desc: "Sivil toplum kuruluşları ve kamu kurumlarına yönelik proje destekleri" },
];
const services = [
  { num: "01", title: "Hibe Araştırma", desc: "Firmanıza uygun ulusal ve uluslararası hibe ve destek programlarını tespit ediyoruz." },
  { num: "02", title: "Proje Geliştirme", desc: "Başvuru dosyanızı A'dan Z'ye hazırlıyoruz. Fizibilite, bütçe ve teknik dokümanlar dahil." },
  { num: "03", title: "Başvuru Yönetimi", desc: "Tüm başvuru sürecini ve bürokratik işlemleri sizin adınıza profesyonelce yönetiyoruz." },
  { num: "04", title: "Stratejik Danışmanlık", desc: "Firmanızın büyüme yol haritasını çizerek sürdürülebilir kaynak planlaması yapıyoruz." },
];
const programs = [
  { name: "KOSGEB", full: "Küçük ve Orta Ölçekli İşletmeleri Geliştirme ve Destekleme İdaresi Başkanlığı" },
  { name: "TÜBİTAK", full: "Türkiye Bilimsel ve Teknolojik Araştırma Kurumu" },
  { name: "Avrupa Birliği", full: "AB Hibe Programları, Horizon Europe, IPA ve diğer fonlar" },
  { name: "Birleşmiş Milletler", full: "UNDP, UNIDO ve diğer BM kalkınma programları" },
];

/* ═══ GRADIENT BORDER CARD ═══ */
function GradCard({ children, style = {} }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: "relative", borderRadius: 20, padding: 1.5, background: h ? "linear-gradient(135deg, #0ABAB5, #2B3A67, #0ABAB5)" : "linear-gradient(135deg, rgba(10,186,181,0.15), rgba(43,58,103,0.1))", transition: "all 0.6s cubic-bezier(.22,1,.36,1)", transform: h ? "translateY(-8px)" : "translateY(0)", ...style }}>
      <div style={{ borderRadius: 19, background: "linear-gradient(135deg, rgba(255,255,255,0.85), rgba(245,240,235,0.95))", backdropFilter: "blur(20px)", padding: "40px 36px", height: "100%", transition: "all 0.6s", boxShadow: h ? "0 25px 60px rgba(10,186,181,0.12), 0 8px 24px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.03)" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("home");
  const [menu, setMenu] = useState(false);
  const [sy, setSy] = useState(0);
  const [legalModal, setLegalModal] = useState(null);

  useEffect(() => {
    const h = () => { setSy(window.scrollY); const secs = SECTIONS.map(id => { const el = document.getElementById(id); return el ? { id, top: el.getBoundingClientRect().top } : { id, top: 9999 }; }); setActive(secs.reduce((a, b) => Math.abs(b.top) < Math.abs(a.top) ? b : a).id); };
    window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h);
  }, []);

  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenu(false); };
  const isHero = active === "home" && sy < 80;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F5F0EB", color: "#1a1a1a", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#F5F0EB}::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#0ABAB5,#2B3A67);border-radius:3px}

.nl{font-family:'Inter';font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;background:none;border:none;cursor:pointer;padding:8px 0;position:relative;transition:all .4s}
.nl::after{content:'';position:absolute;bottom:-2px;left:50%;width:0;height:2px;background:linear-gradient(90deg,#0ABAB5,#2B3A67);transition:all .5s cubic-bezier(.22,1,.36,1);transform:translateX(-50%);border-radius:2px}
.nl:hover::after,.nl.ac::after{width:100%}

.grad-text{background:linear-gradient(135deg,#0ABAB5 0%,#2B3A67 50%,#0ABAB5 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradShift 6s ease infinite}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

.ht{font-family:'Outfit';font-size:clamp(48px,7vw,96px);font-weight:800;line-height:1.02;letter-spacing:-3px;color:#fff}

.sl{font-family:'Inter';font-size:13px;font-weight:700;letter-spacing:4px;text-transform:uppercase;margin-bottom:20px;background:linear-gradient(90deg,#0ABAB5,#2B3A67);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:inline-block}

.st{font-family:'Outfit';font-size:clamp(34px,4.5vw,56px);font-weight:800;line-height:1.1;letter-spacing:-2px;margin-bottom:24px;color:#1a1a1a}
.bt{font-family:'Inter';font-size:18px;line-height:1.8;color:#666;max-width:560px;font-weight:400}

.sc{border-top:2px solid rgba(0,0,0,0.04);padding:48px 0;display:grid;grid-template-columns:60px 1fr 1.5fr;gap:36px;align-items:start;transition:all .5s cubic-bezier(.22,1,.36,1);cursor:default;position:relative}
.sc::before{content:'';position:absolute;top:-2px;left:0;width:0;height:2px;background:linear-gradient(90deg,#0ABAB5,#2B3A67);transition:width .6s cubic-bezier(.22,1,.36,1)}
.sc:hover::before{width:100%}
.sc:hover{padding-left:24px}
.sc:hover .sn{background:linear-gradient(135deg,#0ABAB5,#2B3A67);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sn{font-family:'Inter';font-size:15px;font-weight:700;letter-spacing:1px;color:#ccc;transition:all .5s}

.btn-primary{font-family:'Inter';font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:18px 40px;border:none;background:linear-gradient(135deg,#0ABAB5,#099e9a);color:#fff;cursor:pointer;transition:all .5s;border-radius:50px;position:relative;overflow:hidden}
.btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#2B3A67,#0ABAB5);opacity:0;transition:opacity .5s;border-radius:50px}
.btn-primary:hover::before{opacity:1}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 20px 50px rgba(10,186,181,0.3)}
.btn-primary span{position:relative;z-index:1}

.btn-outline{font-family:'Inter';font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:18px 40px;border:2px solid transparent;background:linear-gradient(#F5F0EB,#F5F0EB) padding-box,linear-gradient(135deg,#0ABAB5,#2B3A67) border-box;color:#0ABAB5;cursor:pointer;transition:all .5s;border-radius:50px}
.btn-outline:hover{background:linear-gradient(135deg,#0ABAB5,#2B3A67) padding-box,linear-gradient(135deg,#0ABAB5,#2B3A67) border-box;color:#fff;transform:translateY(-3px);box-shadow:0 16px 40px rgba(10,186,181,0.2)}

.btn-hero-outline{font-family:'Inter';font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;padding:18px 40px;border:2px solid rgba(255,255,255,0.25);background:transparent;color:#fff;cursor:pointer;transition:all .4s;border-radius:50px}
.btn-hero-outline:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.5)}

.cfi input,.cfi textarea{width:100%;padding:18px 24px;background:rgba(255,255,255,0.6);backdrop-filter:blur(16px);border:2px solid transparent;background-clip:padding-box;border-radius:16px;color:#1a1a1a;font-family:'Inter';font-size:16px;outline:none;transition:all .4s}
.cfi input:focus,.cfi textarea:focus{border:2px solid transparent;background:rgba(255,255,255,0.8) padding-box;outline:2px solid #0ABAB5;outline-offset:-2px}
.cfi input::placeholder,.cfi textarea::placeholder{color:#aaa}
.cfi textarea{resize:vertical;min-height:120px}

.mm{position:fixed;top:0;left:0;width:100%;height:100vh;background:rgba(245,240,235,0.97);backdrop-filter:blur(30px);z-index:998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}
.mm .nl{font-size:16px;letter-spacing:4px;color:#1a1a1a}

.hb{display:none;background:none;border:none;cursor:pointer;padding:8px;z-index:999}
.hb span{display:block;width:24px;height:2px;margin:5px 0;transition:all .3s;border-radius:2px}

.section-gradient-1{background:linear-gradient(180deg,#F5F0EB 0%,#EDE9E4 40%,#E8E4DF 100%)}
.section-gradient-2{background:linear-gradient(180deg,#E8E4DF 0%,#EDE9E4 50%,#F5F0EB 100%)}
.section-gradient-3{background:linear-gradient(180deg,#F5F0EB 0%,#F0EDE8 30%,#EAE5E0 70%,#E5E0DB 100%)}

@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@media(max-width:900px){.hb{display:block}.dn{display:none!important}.sc{grid-template-columns:1fr;gap:12px}.ag,.cg{grid-template-columns:1fr!important}}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, padding: "16px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", background: sy > 80 ? "rgba(245,240,235,0.8)" : "transparent", backdropFilter: sy > 80 ? "blur(24px) saturate(180%)" : "none", borderBottom: sy > 80 ? "1px solid rgba(0,0,0,0.05)" : "none", transition: "all .5s" }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <Logo s={28} />
          <span style={{ fontFamily: "'Outfit'", fontSize: 22, fontWeight: 800, color: isHero ? "#fff" : "#1a1a1a", letterSpacing: -0.5, transition: "color .4s" }}>Grant<span style={{ color: "#0ABAB5" }}>IQ</span>ue</span>
        </button>
        <div className="dn" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {SECTIONS.map(s => (<button key={s} className={`nl ${active === s ? "ac" : ""}`} onClick={() => go(s)} style={{ color: isHero ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = active === s ? "#0ABAB5" : (isHero ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)")}>{navTR[s]}</button>))}
          <button className={isHero ? "btn-hero-outline" : "btn-outline"} onClick={() => go("contact")} style={{ padding: "10px 24px" }}>Randevu Al</button>
        </div>
        <button className="hb" onClick={() => setMenu(!menu)}><span style={{ background: isHero ? "#fff" : "#1a1a1a", transform: menu ? "rotate(45deg) translate(4px,4px)" : "none" }} /><span style={{ background: isHero ? "#fff" : "#1a1a1a", opacity: menu ? 0 : 1 }} /><span style={{ background: isHero ? "#fff" : "#1a1a1a", transform: menu ? "rotate(-45deg) translate(4px,-4px)" : "none" }} /></button>
      </nav>

      {menu && <div className="mm">{SECTIONS.map(s => <button key={s} className="nl" onClick={() => go(s)} style={{ color: "#1a1a1a" }}>{navTR[s]}</button>)}</div>}

      {/* HERO */}
      <section id="home" style={{ height: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #070d14, #0c1825, #0e1a28, #101e30)" }}>
        <HeroCanvas />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 280, zIndex: 1, pointerEvents: "none", background: "linear-gradient(to top, #F5F0EB 0%, rgba(245,240,235,0.6) 40%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "55%", zIndex: 1, pointerEvents: "none", background: "linear-gradient(90deg, rgba(7,13,20,0.55), transparent)" }} />
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", alignItems: "center", padding: "0 56px" }}>
          <div style={{ maxWidth: 1300, margin: "0 auto", width: "100%" }}>
            <Anim><div style={{ fontFamily: "'Inter'", fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: "rgba(10,186,181,0.7)", marginBottom: 36, display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #0ABAB5, transparent)", borderRadius: 1 }} />CareVia LTD bünyesinde</div></Anim>
            <Anim d={0.08}><h1 className="ht">Hibenizi bulun,<br />projenizi <span className="grad-text" style={{ WebkitTextFillColor: "transparent" }}>geliştirin</span>,<br />geleceği inşa edin.</h1></Anim>
            <Anim d={0.18}><p style={{ fontFamily: "'Inter'", fontSize: 19, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", marginTop: 36, maxWidth: 500 }}>KOSGEB, TÜBİTAK, Avrupa Birliği ve Birleşmiş Milletler hibe programlarına profesyonel başvurular ile firmanıza katma değer katıyoruz.</p></Anim>
            <Anim d={0.28}><div style={{ marginTop: 48, display: "flex", gap: 16, flexWrap: "wrap" }}><button className="btn-primary" onClick={() => go("services")}><span>Hizmetlerimiz</span></button><button className="btn-hero-outline" onClick={() => go("contact")}>Ücretsiz Danışmanlık</button></div></Anim>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Inter'", fontSize: 10, fontWeight: 600, letterSpacing: 3, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>Keşfet</span>
          <div style={{ width: 2, height: 32, background: "linear-gradient(to bottom, #0ABAB5, transparent)", borderRadius: 1, animation: "drift 2.5s infinite ease-in-out" }} />
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "linear-gradient(180deg, #F5F0EB, #F0ECE7)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(10,186,181,0.2), transparent)" }} />
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {[{ end: "150", suffix: "+", label: "Tamamlanan Proje" }, { end: "50", prefix: "€", suffix: "M+", label: "Oluşturulan Kaynak" }, { end: "98", suffix: "%", label: "Başarı Oranı" }, { end: "12", suffix: "+", label: "Yıllık Deneyim" }].map((s, i) => (
            <StatCard key={i} end={s.end} suffix={s.suffix} prefix={s.prefix || ""} label={s.label} />
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section-gradient-1" style={{ padding: "140px 56px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><div className="sl">Hakkımızda</div></div></Anim>
          <div className="ag" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start", marginTop: 20 }}>
            <div>
              <Anim><div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 32 }}><Logo s={64} /><h2 className="st" style={{ marginBottom: 0 }}>Stratejik düşünce,<br /><span className="grad-text">somut sonuç.</span></h2></div></Anim>
              <Anim d={0.1}><p className="bt">GrantIQue, CareVia LTD bünyesinde faaliyet gösteren bir proje geliştirme ve danışmanlık markasıdır. Enerjiden teknolojiye, tarımdan girişimciliğe kadar geniş bir yelpazede, ulusal ve uluslararası fon kaynaklarına erişim sağlayarak firmaların büyüme potansiyelini maksimize ediyoruz.</p></Anim>
            </div>
            <div>
              <Anim d={0.15}><p className="bt" style={{ marginTop: 8 }}>Deneyimli ekibimiz, her projeyi benzersiz bir yaklaşımla ele alarak, başvuru sürecinden projenin hayata geçirilmesine kadar her aşamada yanınızda.</p></Anim>
              <Anim d={0.22}><p className="bt" style={{ marginTop: 20 }}>Amacımız sadece hibe almak değil, sürdürülebilir değer yaratmak. KOSGEB, TÜBİTAK, AB ve BM gibi kurumların sağladığı fon ve desteklere profesyonel başvurular hazırlayarak firmanıza katma değer katıyoruz.</p></Anim>
              <Anim d={0.3}><div style={{ marginTop: 36, display: "flex", gap: 16 }}><button className="btn-primary" onClick={() => go("services")}><span>Hizmetlerimiz</span></button><button className="btn-outline" onClick={() => go("contact")}>İletişime Geç</button></div></Anim>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section-gradient-2" style={{ padding: "120px 56px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim><div className="sl">Hizmetlerimiz</div><h2 className="st" style={{ maxWidth: 700 }}>Başvurudan onaya,<br /><span className="grad-text">her adımda yanınızdayız.</span></h2></Anim>
          <div style={{ marginTop: 60 }}>
            {services.map((s, i) => (<Anim key={i} d={i * 0.06}><div className="sc"><span className="sn">{s.num}</span><h3 style={{ fontFamily: "'Outfit'", fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 700, lineHeight: 1.2, color: "#1a1a1a" }}>{s.title}</h3><p className="bt" style={{ maxWidth: "none" }}>{s.desc}</p></div></Anim>))}
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section id="sectors" className="section-gradient-3" style={{ padding: "140px 56px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim><div style={{ textAlign: "center", marginBottom: 72 }}><div className="sl">Faaliyet Alanlarımız</div><h2 className="st">Çok sektörlü,<br /><span className="grad-text">tek nokta çözüm.</span></h2></div></Anim>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {sectors.map((s, i) => (<Anim key={i} d={i * 0.04}><GradCard><div style={{ fontFamily: "'Inter'", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "#0ABAB5", marginBottom: 16 }}>{"0" + (i + 1)}</div><h3 style={{ fontFamily: "'Outfit'", fontSize: 24, fontWeight: 700, marginBottom: 10, color: "#1a1a1a" }}>{s.title}</h3><p style={{ fontFamily: "'Inter'", fontSize: 16, color: "#777", lineHeight: 1.75 }}>{s.desc}</p></GradCard></Anim>))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programs" className="section-gradient-2" style={{ padding: "120px 56px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim><div style={{ textAlign: "center", marginBottom: 72 }}><div className="sl">Başvuru Yaptığımız Kurumlar</div><h2 className="st">Müşterilerimiz adına<br /><span className="grad-text">güçlü kurumlara başvuruyoruz.</span></h2><p className="bt" style={{ margin: "0 auto", textAlign: "center", maxWidth: 560 }}>Firmanıza en uygun hibe ve destek programlarını belirleyerek, aşağıdaki kurumlara profesyonel başvurular hazırlıyoruz.</p></div></Anim>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {programs.map((p, i) => (<Anim key={i} d={i * 0.06}><GradCard style={{ textAlign: "center" }}><div style={{ fontFamily: "'Outfit'", fontSize: 30, fontWeight: 800, letterSpacing: -0.5, marginBottom: 16 }}><span className="grad-text">{p.name}</span></div><p style={{ fontFamily: "'Inter'", fontSize: 15, color: "#888", lineHeight: 1.7 }}>{p.full}</p></GradCard></Anim>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "120px 56px", background: "linear-gradient(160deg, #070d14, #0c1825, #101e30)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(10,186,181,0.1), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(43,58,103,0.08), transparent 60%)" }} />
        <Anim>
          <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Outfit'", fontSize: "clamp(32px, 4.5vw, 54px)", fontWeight: 800, lineHeight: 1.12, marginBottom: 24, color: "#fff", letterSpacing: -2 }}>Firmanızın hibe potansiyelini<br /><span className="grad-text">keşfetmeye hazır mısınız?</span></h2>
            <p style={{ fontFamily: "'Inter'", fontSize: 18, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 500, margin: "0 auto 44px" }}>Ücretsiz ön değerlendirme görüşmesi ile firmanıza uygun hibe programlarını belirleyelim.</p>
            <button className="btn-primary" onClick={() => go("contact")}><span>Hemen Başlayın</span></button>
          </div>
        </Anim>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section-gradient-1" style={{ padding: "120px 56px" }}>
        <div className="cg" style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
          <div>
            <Anim><div className="sl">İletişim</div><h2 className="st">Projenizi<br /><span className="grad-text">konuşalım.</span></h2><p className="bt">Hibe ve destek programları hakkında sorularınızı yanıtlamak ve firmanıza özel çözümler sunmak için buradayız.</p></Anim>
            <Anim d={0.12}>
              <div style={{ marginTop: 48 }}>
                <div style={{ padding: "20px 0", borderBottom: "2px solid rgba(0,0,0,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Inter'", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "#999", textTransform: "uppercase" }}>E-posta</span>
                  <span style={{ fontFamily: "'Inter'", fontSize: 17, color: "#444", fontWeight: 500 }}>kurumsal@grantique.com.tr</span>
                </div>
                <div style={{ padding: "24px 0", borderBottom: "2px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontFamily: "'Inter'", fontSize: 12, fontWeight: 700, letterSpacing: 3, color: "#999", textTransform: "uppercase", display: "block", marginBottom: 16 }}>Ofislerimiz</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {["İstanbul, Türkiye", "Lahore, Pakistan", "Dakar, Senegal", "Washington DC, USA"].map((addr, i) => (
                      <div key={i} style={{ fontFamily: "'Inter'", fontSize: 15, color: "#444", fontWeight: 500, padding: "10px 18px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)", borderRadius: 14, border: "1px solid rgba(10,186,181,0.1)" }}>{addr}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Anim>
          </div>
          <Anim d={0.08}><div className="cfi" style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}><input type="text" placeholder="Adınız Soyadınız" /><input type="email" placeholder="E-posta Adresiniz" /><input type="text" placeholder="Firma Adı" /><input type="text" placeholder="İlgilendiğiniz Hibe Programı" /><textarea placeholder="Projeniz hakkında kısa bilgi..." rows={4} /><button className="btn-primary" style={{ alignSelf: "flex-start" }}><span>Gönder</span></button></div></Anim>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "60px 56px 32px", background: "linear-gradient(180deg, #E8E3DE, #E2DDD8)", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><Logo s={26} /><span style={{ fontFamily: "'Outfit'", fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>Grant<span style={{ color: "#0ABAB5" }}>IQ</span>ue</span></div>
              <p style={{ fontFamily: "'Inter'", fontSize: 14, color: "#999", maxWidth: 280, lineHeight: 1.7 }}>Proje Geliştirme & Danışmanlık<br />CareVia LTD bünyesinde bir markadır.</p>
              <p style={{ fontFamily: "'Inter'", fontSize: 13, color: "#aaa", marginTop: 12 }}>kurumsal@grantique.com.tr</p>
            </div>
            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              <div><div style={{ fontFamily: "'Inter'", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 20 }}>Sayfalar</div>{SECTIONS.map(s => (<button key={s} onClick={() => go(s)} style={{ display: "block", background: "none", border: "none", color: "#888", fontFamily: "'Inter'", fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "6px 0", transition: "color .3s" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "#888"}>{navTR[s]}</button>))}</div>
              <div><div style={{ fontFamily: "'Inter'", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 20 }}>Programlar</div>{["KOSGEB", "TÜBİTAK", "AB Hibeleri", "BM Fonları"].map(p => (<div key={p} style={{ fontFamily: "'Inter'", fontSize: 15, color: "#888", fontWeight: 500, padding: "6px 0" }}>{p}</div>))}</div>
              <div><div style={{ fontFamily: "'Inter'", fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "#aaa", textTransform: "uppercase", marginBottom: 20 }}>Yasal</div><button onClick={() => setLegalModal("kvkk")} style={{ display: "block", background: "none", border: "none", color: "#888", fontFamily: "'Inter'", fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "6px 0", transition: "color .3s" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "#888"}>KVKK Aydınlatma Metni</button><button onClick={() => setLegalModal("terms")} style={{ display: "block", background: "none", border: "none", color: "#888", fontFamily: "'Inter'", fontSize: 15, fontWeight: 500, cursor: "pointer", padding: "6px 0", transition: "color .3s" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "#888"}>Kullanım Koşulları</button></div>
            </div>
          </div>
          <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontFamily: "'Inter'", fontSize: 12, color: "#bbb", fontWeight: 500 }}>© 2026 GrantIQue — CareVia LTD. Tüm hakları saklıdır.</span>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => setLegalModal("kvkk")} style={{ background: "none", border: "none", fontFamily: "'Inter'", fontSize: 12, color: "#bbb", fontWeight: 500, cursor: "pointer", transition: "color .3s" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "#bbb"}>KVKK</button>
              <button onClick={() => setLegalModal("terms")} style={{ background: "none", border: "none", fontFamily: "'Inter'", fontSize: 12, color: "#bbb", fontWeight: 500, cursor: "pointer", transition: "color .3s" }} onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "#bbb"}>Kullanım Koşulları</button>
              <span style={{ fontFamily: "'Inter'", fontSize: 12, color: "#bbb" }}>İstanbul • Lahore • Dakar • Washington DC</span>
            </div>
          </div>
        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setLegalModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg, #F5F0EB, #EDE9E4)", borderRadius: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", overflow: "auto", padding: "48px 56px", boxShadow: "0 40px 100px rgba(0,0,0,0.2), 0 0 0 1px rgba(10,186,181,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Outfit'", fontSize: 28, fontWeight: 800, color: "#1a1a1a" }}>{legalModal === "kvkk" ? "KVKK Aydınlatma Metni" : "Kullanım Koşulları"}</h2>
              <button onClick={() => setLegalModal(null)} style={{ background: "rgba(0,0,0,0.05)", border: "none", width: 40, height: 40, borderRadius: 50, cursor: "pointer", fontSize: 18, color: "#666", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .3s" }} onMouseOver={e => { e.target.style.background = "rgba(10,186,181,0.1)"; e.target.style.color = "#0ABAB5"; }} onMouseOut={e => { e.target.style.background = "rgba(0,0,0,0.05)"; e.target.style.color = "#666"; }}>✕</button>
            </div>
            {legalModal === "kvkk" ? (
              <div style={{ fontFamily: "'Inter'", fontSize: 15, color: "#555", lineHeight: 1.9 }}>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Veri Sorumlusu: CareVia LTD — GrantIQue Markası</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>1. Kişisel Verilerin İşlenme Amacı</p><p>Kişisel verileriniz; hibe ve destek programlarına başvuru süreçlerinin yürütülmesi, proje geliştirme ve danışmanlık hizmetlerinin sunulması, iletişim faaliyetlerinin yürütülmesi, yasal yükümlülüklerin yerine getirilmesi ve firma faaliyetlerinin mevzuata uygun şekilde sürdürülmesi amaçlarıyla işlenmektedir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>2. İşlenen Kişisel Veri Kategorileri</p><p>Kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta, telefon, adres), firma bilgileri (unvan, faaliyet alanı, vergi numarası), proje ve başvuru bilgileri, finansal bilgiler (bütçe ve hibe tutarları).</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>3. Kişisel Verilerin Aktarılması</p><p>Kişisel verileriniz; KOSGEB, TÜBİTAK, Avrupa Birliği kurumları, Birleşmiş Milletler programları ve ilgili kamu kuruluşlarına başvuru süreçleri kapsamında, yasal zorunluluklar çerçevesinde yetkili kurum ve kuruluşlara aktarılabilmektedir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>4. Veri Toplama Yöntemi ve Hukuki Sebebi</p><p>Kişisel verileriniz; web sitemiz üzerindeki iletişim formu, e-posta yazışmaları ve yüz yüze görüşmeler aracılığıyla, açık rızanız ve sözleşmenin ifası hukuki sebeplerine dayalı olarak toplanmaktadır.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>5. Haklarınız (KVKK Madde 11)</p><p>Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurtiçinde veya yurtdışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme, KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme haklarına sahipsiniz.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>6. İletişim</p><p>Haklarınızı kullanmak için <strong>kurumsal@grantique.com.tr</strong> adresine başvurabilirsiniz.</p>
              </div>
            ) : (
              <div style={{ fontFamily: "'Inter'", fontSize: 15, color: "#555", lineHeight: 1.9 }}>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 16 }}>Son Güncelleme: Nisan 2026</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>1. Hizmet Kapsamı</p><p>GrantIQue, CareVia LTD bünyesinde faaliyet gösteren bir proje geliştirme ve danışmanlık markasıdır. Web sitemiz, hibe araştırma, proje geliştirme, başvuru yönetimi ve stratejik danışmanlık hizmetleri hakkında bilgi vermek amacıyla işletilmektedir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>2. Fikri Mülkiyet Hakları</p><p>Bu web sitesindeki tüm içerikler, tasarımlar, logolar, metinler ve görseller CareVia LTD'nin mülkiyetindedir. Yazılı izin olmaksızın kopyalanamaz, çoğaltılamaz veya dağıtılamaz.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>3. Hizmet Garantisi ve Sorumluluk</p><p>GrantIQue, hibe başvurularının onaylanacağını garanti etmez. Sunulan hizmetler danışmanlık niteliğinde olup, başvuru sonuçları ilgili kurumların değerlendirme süreçlerine tabidir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>4. Gizlilik ve Veri Koruma</p><p>İletişim formu aracılığıyla paylaştığınız bilgiler gizlilik ilkeleri çerçevesinde korunmaktadır. Kişisel verilerin işlenmesine ilişkin detaylı bilgi için KVKK Aydınlatma Metnimizi inceleyebilirsiniz.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>5. Üçüncü Taraf Bağlantıları</p><p>Web sitemiz, KOSGEB, TÜBİTAK, AB ve BM gibi üçüncü taraf kuruluşların web sitelerine bağlantılar içerebilir. Bu sitelerin içerik ve gizlilik politikalarından GrantIQue sorumlu değildir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>6. Değişiklikler</p><p>CareVia LTD, bu kullanım koşullarını önceden bildirmeksizin güncelleme hakkını saklı tutar.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>7. Uygulanacak Hukuk</p><p>Bu kullanım koşulları Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>
                <p style={{ fontWeight: 700, color: "#1a1a1a", marginTop: 24, marginBottom: 8 }}>8. İletişim</p><p>Sorularınız için <strong>kurumsal@grantique.com.tr</strong> adresine başvurabilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
