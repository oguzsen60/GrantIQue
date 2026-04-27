import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const SECTIONS = ["home", "about", "services", "sectors", "programs", "contact"];
const navTR = { home: "Ana Sayfa", about: "Hakkımızda", services: "Hizmetler", sectors: "Sektörler", programs: "Destek Programları", contact: "İletişim" };

function useInView(t = 0.12) {
  const r = useRef(null);
  const [v, s] = useState(false);
  useEffect(() => {
    const el = r.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { s(true); o.unobserve(el); }
    }, { threshold: t });
    o.observe(el);
    return () => o.disconnect();
  }, [t]);
  return [r, v];
}

function Anim({ children, cls = "", d = 0 }) {
  const [r, v] = useInView(0.08);
  return (
    <div ref={r} className={cls} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.9s cubic-bezier(.16,1,.3,1) ${d}s, transform 0.9s cubic-bezier(.16,1,.3,1) ${d}s`,
    }}>
      {children}
    </div>
  );
}

/* ═══════════ 3D HERO — LIGHT THEME ═══════════ */
function HeroCanvas() {
  const mount = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const raf = useRef(null);

  useEffect(() => {
    const c = mount.current;
    if (!c) return;
    const W = c.clientWidth, H = c.clientHeight;

    const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ren.setSize(W, H);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setClearColor(0x000000, 0);
    c.appendChild(ren.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, W / H, 0.1, 1000);
    cam.position.set(0, 0, 38);

    const TEAL = new THREE.Color(0x0abab5);
    const NAVY = new THREE.Color(0x2b3a67);
    const LIGHT = new THREE.Color(0x8ecae6);

    // Outer dodecahedron
    const g1 = new THREE.DodecahedronGeometry(9, 0);
    const e1 = new THREE.EdgesGeometry(g1);
    const l1 = new THREE.LineSegments(e1, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.15 }));
    scene.add(l1);

    // Mid icosahedron
    const g2 = new THREE.IcosahedronGeometry(6.5, 1);
    const e2 = new THREE.EdgesGeometry(g2);
    const l2 = new THREE.LineSegments(e2, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.25 }));
    scene.add(l2);

    // Inner icosahedron
    const g3 = new THREE.IcosahedronGeometry(3.8, 1);
    const e3 = new THREE.EdgesGeometry(g3);
    const l3 = new THREE.LineSegments(e3, new THREE.LineBasicMaterial({ color: NAVY, transparent: true, opacity: 0.35 }));
    scene.add(l3);

    // Core octahedron
    const g4 = new THREE.OctahedronGeometry(1.8, 0);
    const e4 = new THREE.EdgesGeometry(g4);
    const l4 = new THREE.LineSegments(e4, new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5 }));
    scene.add(l4);

    // Center glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.12 })
    );
    scene.add(glow);

    // Halo
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.4, 64),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.05, side: THREE.DoubleSide })
    );
    scene.add(halo);

    // Particles
    const PC = 300;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(PC * 3);
    const col = new Float32Array(PC * 3);
    const sz = new Float32Array(PC);
    const pd = [];

    for (let i = 0; i < PC; i++) {
      const shell = Math.random();
      const radius = shell < 0.3 ? 8 + Math.random() * 4 : shell < 0.6 ? 14 + Math.random() * 6 : 22 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      const cc = shell < 0.4 ? TEAL : shell < 0.7 ? NAVY : LIGHT;
      col[i * 3] = cc.r; col[i * 3 + 1] = cc.g; col[i * 3 + 2] = cc.b;
      sz[i] = shell < 0.3 ? 2 + Math.random() * 1.5 : 1 + Math.random() * 1.5;
      pd.push({ radius, theta, phi, speed: 0.0002 + Math.random() * 0.0007, drift: (Math.random() - 0.5) * 0.0003 });
    }

    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    pGeo.setAttribute("size", new THREE.BufferAttribute(sz, 1));

    const pMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.NormalBlending, vertexColors: true,
      vertexShader: `
        attribute float size;
        varying vec3 vC;
        varying float vD;
        void main() {
          vC = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vD = -mv.z;
          gl_PointSize = size * (250.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vC;
        varying float vD;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          a *= 0.65;
          float fog = clamp(1.0 - vD / 70.0, 0.15, 1.0);
          gl_FragColor = vec4(vC, a * fog);
        }
      `,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // Connection lines
    const ML = 140;
    const la = new Float32Array(ML * 6);
    const lca = new Float32Array(ML * 6);
    const lG = new THREE.BufferGeometry();
    lG.setAttribute("position", new THREE.BufferAttribute(la, 3));
    lG.setAttribute("color", new THREE.BufferAttribute(lca, 3));
    lG.setDrawRange(0, 0);
    const cLines = new THREE.LineSegments(lG, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.12 }));
    scene.add(cLines);

    // Orbital rings
    const rings = [];
    for (let r = 0; r < 5; r++) {
      const rr = 7 + r * 4;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(rr - 0.012, rr + 0.012, 200),
        new THREE.MeshBasicMaterial({ color: r % 2 === 0 ? TEAL : NAVY, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 3 + r * 0.35;
      ring.rotation.y = r * 0.5;
      rings.push({ mesh: ring, bx: ring.rotation.x, spd: 0.03 + r * 0.015 });
      scene.add(ring);
    }

    const onMM = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMM);

    const onR = () => {
      const w = c.clientWidth, h = c.clientHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onR);

    let t = 0;
    const anim = () => {
      raf.current = requestAnimationFrame(anim);
      t += 0.006;
      const mx = mouse.current.x, my = mouse.current.y;

      cam.position.x += (mx * 5 - cam.position.x) * 0.015;
      cam.position.y += (my * 4 - cam.position.y) * 0.015;
      cam.lookAt(0, 0, 0);

      l1.rotation.x = t * 0.08 + my * 0.15;
      l1.rotation.y = t * 0.06 + mx * 0.15;
      l2.rotation.x = t * 0.12 + my * 0.25;
      l2.rotation.y = t * 0.15 + mx * 0.25;
      l3.rotation.x = -t * 0.18 + my * 0.2;
      l3.rotation.y = -t * 0.12 + mx * 0.2;
      l4.rotation.x = t * 0.4;
      l4.rotation.y = t * 0.3;
      l4.rotation.z = t * 0.2;

      glow.material.opacity = 0.1 + Math.sin(t * 1.8) * 0.06;
      glow.scale.setScalar(1 + Math.sin(t * 1.2) * 0.25);
      halo.rotation.x = t * 0.2;
      halo.rotation.y = t * 0.15;

      const pa = pGeo.attributes.position.array;
      for (let i = 0; i < PC; i++) {
        const d = pd[i];
        d.theta += d.speed;
        d.phi += d.drift;
        pa[i * 3] = d.radius * Math.sin(d.phi) * Math.cos(d.theta);
        pa[i * 3 + 1] = d.radius * Math.sin(d.phi) * Math.sin(d.theta) + Math.sin(t * 0.8 + i * 0.1) * 0.5;
        pa[i * 3 + 2] = d.radius * Math.cos(d.phi);
      }
      pGeo.attributes.position.needsUpdate = true;

      let li = 0;
      const lpa = lG.attributes.position.array;
      const lcaa = lG.attributes.color.array;
      for (let i = 0; i < PC && li < ML; i++) {
        for (let j = i + 1; j < PC && li < ML; j++) {
          const dx = pa[i * 3] - pa[j * 3], dy = pa[i * 3 + 1] - pa[j * 3 + 1], dz = pa[i * 3 + 2] - pa[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 5.5) {
            const idx = li * 6;
            lpa[idx] = pa[i * 3]; lpa[idx + 1] = pa[i * 3 + 1]; lpa[idx + 2] = pa[i * 3 + 2];
            lpa[idx + 3] = pa[j * 3]; lpa[idx + 4] = pa[j * 3 + 1]; lpa[idx + 5] = pa[j * 3 + 2];
            const a = 1 - dist / 5.5;
            lcaa[idx] = TEAL.r * a; lcaa[idx + 1] = TEAL.g * a; lcaa[idx + 2] = TEAL.b * a;
            lcaa[idx + 3] = TEAL.r * a; lcaa[idx + 4] = TEAL.g * a; lcaa[idx + 5] = TEAL.b * a;
            li++;
          }
        }
      }
      lG.setDrawRange(0, li * 2);
      lG.attributes.position.needsUpdate = true;
      lG.attributes.color.needsUpdate = true;

      rings.forEach(r => {
        r.mesh.rotation.x = r.bx + t * r.spd;
        r.mesh.rotation.z = Math.sin(t * 0.25) * 0.08;
      });

      ren.render(scene, cam);
    };
    anim();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("resize", onR);
      ren.dispose();
      if (c.contains(ren.domElement)) c.removeChild(ren.domElement);
    };
  }, []);

  return (
    <div ref={mount} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }} />
  );
}

/* ═══════════ LOGO ═══════════ */
const Logo = ({ s = 40 }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
    <line x1="50" y1="8" x2="50" y2="92" stroke="#0ABAB5" strokeWidth="4.5" strokeLinecap="round" />
    <line x1="14" y1="29" x2="86" y2="71" stroke="#2B3A67" strokeWidth="4.5" strokeLinecap="round" />
    <line x1="86" y1="29" x2="14" y2="71" stroke="#0ABAB5" strokeWidth="4.5" strokeLinecap="round" />
    <line x1="18" y1="50" x2="82" y2="50" stroke="#2B3A67" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

/* ═══════════ DATA ═══════════ */
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

const stats = [
  { value: "150+", label: "Tamamlanan Proje" },
  { value: "€50M+", label: "Oluşturulan Kaynak" },
  { value: "98%", label: "Başarı Oranı" },
  { value: "12+", label: "Yıllık Deneyim" },
];

/* ═══════════ MAIN APP ═══════════ */
export default function App() {
  const [active, setActive] = useState("home");
  const [menu, setMenu] = useState(false);
  const [sy, setSy] = useState(0);

  useEffect(() => {
    const h = () => {
      setSy(window.scrollY);
      const secs = SECTIONS.map(id => {
        const el = document.getElementById(id);
        return el ? { id, top: el.getBoundingClientRect().top } : { id, top: 9999 };
      });
      setActive(secs.reduce((a, b) => Math.abs(b.top) < Math.abs(a.top) ? b : a).id);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenu(false);
  };

  const heroActive = active === "home";

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: "#FAFBFC", color: "#1a1a2e", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #FAFBFC; }
::-webkit-scrollbar-thumb { background: #0ABAB5; border-radius: 2px; }

.nl {
  font-family: 'DM Sans', sans-serif; font-size: 10.5px; letter-spacing: 3px;
  text-transform: uppercase; color: rgba(26,26,46,0.45); background: none; border: none;
  cursor: pointer; padding: 8px 0; position: relative; transition: color .4s;
}
.nl:hover, .nl.ac { color: #0ABAB5; }
.nl::after {
  content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 1px;
  background: #0ABAB5; transition: all .5s cubic-bezier(.16,1,.3,1); transform: translateX(-50%);
}
.nl:hover::after, .nl.ac::after { width: 100%; }

.nl-hero {
  font-family: 'DM Sans', sans-serif; font-size: 10.5px; letter-spacing: 3px;
  text-transform: uppercase; color: rgba(255,255,255,0.5); background: none; border: none;
  cursor: pointer; padding: 8px 0; position: relative; transition: color .4s;
}
.nl-hero:hover, .nl-hero.ac { color: #0ABAB5; }
.nl-hero::after {
  content: ''; position: absolute; bottom: 0; left: 50%; width: 0; height: 1px;
  background: #0ABAB5; transition: all .5s cubic-bezier(.16,1,.3,1); transform: translateX(-50%);
}
.nl-hero:hover::after, .nl-hero.ac::after { width: 100%; }

.ht {
  font-family: 'Playfair Display', serif; font-size: clamp(42px, 6.5vw, 92px);
  font-weight: 400; line-height: 1.04; letter-spacing: -2.5px; color: #fff;
}
.ht em { color: #0ABAB5; font-style: italic; font-weight: 500; }

.sl {
  font-family: 'DM Sans', sans-serif; font-size: 10px; letter-spacing: 5px;
  text-transform: uppercase; color: #0ABAB5; margin-bottom: 24px;
  display: flex; align-items: center; gap: 16px;
}
.sl::before { content: ''; width: 40px; height: 1px; background: #0ABAB5; }

.st {
  font-family: 'Playfair Display', serif; font-size: clamp(28px, 4vw, 52px);
  font-weight: 400; line-height: 1.15; letter-spacing: -1.5px; margin-bottom: 24px; color: #1a1a2e;
}
.st em { color: #0ABAB5; font-style: italic; }

.bt {
  font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.85;
  color: rgba(26,26,46,0.5); max-width: 540px;
}

.sc {
  border-top: 1px solid rgba(26,26,46,0.06); padding: 48px 0;
  display: grid; grid-template-columns: 60px 1fr 1.5fr; gap: 36px;
  align-items: start; transition: all .6s cubic-bezier(.16,1,.3,1); cursor: default;
}
.sc:hover { border-top-color: #0ABAB5; padding-left: 28px; background: linear-gradient(90deg, rgba(10,186,181,0.03), transparent); }
.sc:hover .sn { color: #0ABAB5; }
.sn {
  font-family: 'DM Sans', sans-serif; font-size: 13px; letter-spacing: 2px;
  color: rgba(26,26,46,0.15); transition: all .5s;
}

.sk {
  position: relative; padding: 40px 32px; border: 1px solid rgba(26,26,46,0.06);
  border-radius: 12px; transition: all .5s cubic-bezier(.16,1,.3,1); cursor: default;
  background: #fff; overflow: hidden;
}
.sk:hover {
  border-color: rgba(10,186,181,0.2); transform: translateY(-6px);
  box-shadow: 0 20px 60px rgba(10,186,181,0.08);
}

.pg {
  text-align: center; padding: 52px 28px; border: 1px solid rgba(26,26,46,0.06);
  border-radius: 12px; transition: all .5s; background: #fff;
}
.pg:hover { border-color: rgba(10,186,181,0.2); box-shadow: 0 16px 48px rgba(10,186,181,0.06); transform: translateY(-4px); }

.si { text-align: center; padding: 44px 20px; }
.sv {
  font-family: 'Playfair Display', serif; font-size: clamp(34px, 4vw, 50px);
  font-weight: 400; color: #0ABAB5; letter-spacing: -1px; font-style: italic;
}
.slb {
  font-family: 'DM Sans', sans-serif; font-size: 10px; letter-spacing: 3px;
  text-transform: uppercase; color: rgba(26,26,46,0.3); margin-top: 10px;
}

.cb {
  font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 4px;
  text-transform: uppercase; padding: 16px 36px; border: 1px solid rgba(255,255,255,0.35);
  background: transparent; color: #fff; cursor: pointer;
  transition: all .5s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden;
}
.cb::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: #fff; transition: left .5s cubic-bezier(.16,1,.3,1); z-index: 0;
}
.cb:hover::before { left: 0; }
.cb:hover { color: #1a1a2e; border-color: #fff; }
.cb span { position: relative; z-index: 1; }

.cb-dark {
  font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 4px;
  text-transform: uppercase; padding: 16px 36px; border: 1px solid rgba(10,186,181,0.3);
  background: transparent; color: #0ABAB5; cursor: pointer;
  transition: all .5s cubic-bezier(.16,1,.3,1); position: relative; overflow: hidden;
}
.cb-dark::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: #0ABAB5; transition: left .5s cubic-bezier(.16,1,.3,1); z-index: 0;
}
.cb-dark:hover::before { left: 0; }
.cb-dark:hover { color: #fff; border-color: #0ABAB5; }
.cb-dark span { position: relative; z-index: 1; }

.cf {
  font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 4px;
  text-transform: uppercase; padding: 16px 36px; border: none;
  background: #0ABAB5; color: #fff; cursor: pointer; font-weight: 600;
  transition: all .5s; border-radius: 2px;
}
.cf:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(10,186,181,0.25); background: #099e9a; }

.cfi input, .cfi textarea {
  width: 100%; padding: 16px 0; background: transparent; border: none;
  border-bottom: 1px solid rgba(26,26,46,0.08); color: #1a1a2e;
  font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none;
  transition: border-color .4s;
}
.cfi input:focus, .cfi textarea:focus { border-bottom-color: #0ABAB5; }
.cfi input::placeholder, .cfi textarea::placeholder { color: rgba(26,26,46,0.25); }
.cfi textarea { resize: vertical; min-height: 100px; }

.mm {
  position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
  background: rgba(255,255,255,0.97); backdrop-filter: blur(30px); z-index: 998;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px;
}
.mm .nl { font-size: 14px; letter-spacing: 5px; color: #1a1a2e; }

.hb { display: none; background: none; border: none; cursor: pointer; padding: 8px; z-index: 999; }
.hb span { display: block; width: 22px; height: 1px; margin: 6px 0; transition: all .3s; }

@keyframes drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@media (max-width: 900px) {
  .hb { display: block; }
  .dn { display: none !important; }
  .sc { grid-template-columns: 1fr; gap: 12px; }
  .ag, .cg { grid-template-columns: 1fr !important; }
  .hero-sub { max-width: 100% !important; }
}
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, padding: "20px 56px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: sy > 80 ? "rgba(250,251,252,0.92)" : "transparent",
        backdropFilter: sy > 80 ? "blur(20px)" : "none",
        borderBottom: sy > 80 ? "1px solid rgba(26,26,46,0.06)" : "1px solid transparent",
        transition: "all .5s",
      }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
          <Logo s={26} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 400, color: heroActive && sy < 80 ? "#fff" : "#1a1a2e", letterSpacing: 1, transition: "color .5s" }}>
            Grant<em style={{ color: "#0ABAB5", fontStyle: "italic" }}>IQ</em>ue
          </span>
        </button>
        <div className="dn" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {SECTIONS.map(s => (
            <button key={s} className={`${heroActive && sy < 80 ? "nl-hero" : "nl"} ${active === s ? "ac" : ""}`} onClick={() => go(s)}>
              {navTR[s]}
            </button>
          ))}
          <button className={heroActive && sy < 80 ? "cb" : "cb-dark"} onClick={() => go("contact")} style={{ padding: "10px 24px", marginLeft: 8 }}>
            <span>Randevu Al</span>
          </button>
        </div>
        <button className="hb" onClick={() => setMenu(!menu)}>
          <span style={{ background: heroActive && sy < 80 ? "#fff" : "#1a1a2e", transform: menu ? "rotate(45deg) translate(4px,4px)" : "none" }} />
          <span style={{ background: heroActive && sy < 80 ? "#fff" : "#1a1a2e", opacity: menu ? 0 : 1 }} />
          <span style={{ background: heroActive && sy < 80 ? "#fff" : "#1a1a2e", transform: menu ? "rotate(-45deg) translate(4px,-4px)" : "none" }} />
        </button>
      </nav>

      {menu && (
        <div className="mm">
          {SECTIONS.map(s => (
            <button key={s} className="nl" onClick={() => go(s)}>{navTR[s]}</button>
          ))}
        </div>
      )}

      {/* ═══ HERO (DARK) ═══ */}
      <section id="home" style={{ height: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0c1929, #0a1520, #081018)" }}>
        <HeroCanvas />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200, zIndex: 1, pointerEvents: "none", background: "linear-gradient(to top, #FAFBFC, transparent)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "50%", zIndex: 1, pointerEvents: "none", background: "linear-gradient(90deg, rgba(10,21,32,0.5), transparent)" }} />

        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", alignItems: "center", padding: "0 56px" }}>
          <div style={{ maxWidth: 1300, margin: "0 auto", width: "100%" }}>
            <Anim>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 5, textTransform: "uppercase", color: "rgba(10,186,181,0.7)", marginBottom: 40, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 40, height: 1, background: "rgba(10,186,181,0.5)", display: "inline-block" }} />
                CareVia LTD bünyesinde
              </div>
            </Anim>
            <Anim d={0.12}><h1 className="ht">Hibenizi bulun,<br />projenizi <em>geliştirin</em>,<br />geleceği inşa edin.</h1></Anim>
            <Anim d={0.28}><p className="hero-sub" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.85, color: "rgba(255,255,255,0.45)", marginTop: 40, maxWidth: 460 }}>KOSGEB, TÜBİTAK, Avrupa Birliği ve Birleşmiş Milletler hibe programlarına profesyonel başvurular ile firmanıza katma değer katıyoruz.</p></Anim>
            <Anim d={0.42}>
              <div style={{ marginTop: 48, display: "flex", gap: 20, flexWrap: "wrap" }}>
                <button className="cf" onClick={() => go("services")}>Hizmetlerimiz</button>
                <button className="cb" onClick={() => go("contact")}><span>Ücretsiz Danışmanlık</span></button>
              </div>
            </Anim>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: 4, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>Keşfet</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, rgba(10,186,181,0.5), transparent)", animation: "drift 3s infinite ease-in-out" }} />
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ background: "#fff", borderBottom: "1px solid rgba(26,26,46,0.06)" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          {stats.map((s, i) => (
            <Anim key={i} d={i * 0.08}>
              <div className="si" style={{ borderRight: i < 3 ? "1px solid rgba(26,26,46,0.06)" : "none" }}>
                <div className="sv">{s.value}</div>
                <div className="slb">{s.label}</div>
              </div>
            </Anim>
          ))}
        </div>
      </section>

      {/* ═══ ABOUT ═══ */}
      <section id="about" style={{ padding: "140px 56px", background: "#FAFBFC" }}>
        <div className="ag" style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 80, alignItems: "center" }}>
          <div>
            <Anim><div className="sl">Hakkımızda</div><h2 className="st">Stratejik düşünce,<br /><em>somut sonuç.</em></h2></Anim>
            <Anim d={0.12}><p className="bt">GrantIQue, CareVia LTD bünyesinde faaliyet gösteren bir proje geliştirme ve danışmanlık markasıdır. Enerjiden teknolojiye, tarımdan girişimciliğe kadar geniş bir yelpazede, ulusal ve uluslararası fon kaynaklarına erişim sağlayarak firmaların büyüme potansiyelini maksimize ediyoruz.</p></Anim>
            <Anim d={0.2}><p className="bt" style={{ marginTop: 20 }}>Deneyimli ekibimiz, her projeyi benzersiz bir yaklaşımla ele alarak, başvuru sürecinden projenin hayata geçirilmesine kadar her aşamada yanınızda. Amacımız sadece hibe almak değil, sürdürülebilir değer yaratmak.</p></Anim>
          </div>
          <Anim d={0.15}>
            <div style={{ position: "relative", height: 480, background: "#fff", border: "1px solid rgba(26,26,46,0.06)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.04)" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 30%, rgba(10,186,181,0.04), transparent 60%)" }} />
              <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                <Logo s={72} />
                <div style={{ marginTop: 20, fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, letterSpacing: 2, color: "#1a1a2e" }}>
                  Grant<em style={{ color: "#0ABAB5", fontStyle: "italic" }}>IQ</em>ue
                </div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 10, letterSpacing: 5, color: "rgba(26,26,46,0.25)", marginTop: 14, textTransform: "uppercase" }}>Proje Geliştirme & Danışmanlık</div>
                <div style={{ width: 40, height: 1, background: "rgba(10,186,181,0.3)", margin: "24px auto 0" }} />
                <div style={{ fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: 4, color: "rgba(26,26,46,0.15)", marginTop: 16, textTransform: "uppercase" }}>CareVia LTD</div>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" style={{ padding: "120px 56px", background: "#fff" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim><div className="sl">Hizmetlerimiz</div><h2 className="st" style={{ maxWidth: 650 }}>Başvurudan onaya,<br /><em>her adımda yanınızdayız.</em></h2></Anim>
          <div style={{ marginTop: 64 }}>
            {services.map((s, i) => (
              <Anim key={i} d={i * 0.08}>
                <div className="sc">
                  <span className="sn">{s.num}</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 400, lineHeight: 1.3, color: "#1a1a2e" }}>{s.title}</h3>
                  <p className="bt" style={{ maxWidth: "none" }}>{s.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTORS ═══ */}
      <section id="sectors" style={{ padding: "140px 56px", background: "#FAFBFC" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <div className="sl" style={{ justifyContent: "center" }}>Faaliyet Alanlarımız</div>
              <h2 className="st">Çok sektörlü,<br /><em>tek nokta çözüm.</em></h2>
            </div>
          </Anim>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {sectors.map((s, i) => (
              <Anim key={i} d={i * 0.04}>
                <div className="sk">
                  <div style={{ fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: 4, color: "rgba(10,186,181,0.6)", textTransform: "uppercase", marginBottom: 16 }}>{"0" + (i + 1)}</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, marginBottom: 10, color: "#1a1a2e" }}>{s.title}</h3>
                  <p style={{ fontFamily: "'DM Sans'", fontSize: 13.5, color: "rgba(26,26,46,0.4)", lineHeight: 1.75 }}>{s.desc}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROGRAMS ═══ */}
      <section id="programs" style={{ padding: "120px 56px", background: "#fff" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Anim>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <div className="sl" style={{ justifyContent: "center" }}>Başvuru Yaptığımız Kurumlar</div>
              <h2 className="st">Müşterilerimiz adına<br /><em>güçlü kurumlara başvuruyoruz.</em></h2>
              <p className="bt" style={{ margin: "0 auto", textAlign: "center", maxWidth: 540 }}>Firmanıza en uygun hibe ve destek programlarını belirleyerek, aşağıdaki kurumlara profesyonel başvurular hazırlıyoruz.</p>
            </div>
          </Anim>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {programs.map((p, i) => (
              <Anim key={i} d={i * 0.08}>
                <div className="pg">
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 500, letterSpacing: 0.5, color: "#0ABAB5", marginBottom: 16, fontStyle: "italic" }}>{p.name}</div>
                  <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "rgba(26,26,46,0.4)", lineHeight: 1.7 }}>{p.full}</p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "120px 56px", background: "linear-gradient(135deg, #0c1929, #0a1520)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(10,186,181,0.06), transparent 60%)" }} />
        <Anim>
          <div style={{ maxWidth: 750, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 24, color: "#fff", letterSpacing: -1 }}>
              Firmanızın hibe potansiyelini<br /><em style={{ color: "#0ABAB5", fontStyle: "italic" }}>keşfetmeye hazır mısınız?</em>
            </h2>
            <p style={{ fontFamily: "'DM Sans'", fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: 500, margin: "0 auto 44px" }}>Ücretsiz ön değerlendirme görüşmesi ile firmanıza uygun hibe programlarını belirleyelim.</p>
            <button className="cf" onClick={() => go("contact")}>Hemen Başlayın</button>
          </div>
        </Anim>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" style={{ padding: "120px 56px", background: "#FAFBFC" }}>
        <div className="cg" style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80 }}>
          <div>
            <Anim><div className="sl">İletişim</div><h2 className="st">Projenizi<br /><em>konuşalım.</em></h2><p className="bt">Hibe ve destek programları hakkında sorularınızı yanıtlamak ve firmanıza özel çözümler sunmak için buradayız.</p></Anim>
            <Anim d={0.15}>
              <div style={{ marginTop: 52 }}>
                {[{ l: "E-posta", v: "info@grantique.com" }, { l: "Telefon", v: "+90 (212) 000 00 00" }, { l: "Adres", v: "İstanbul, Türkiye" }].map((item, i) => (
                  <div key={i} style={{ padding: "20px 0", borderBottom: "1px solid rgba(26,26,46,0.06)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "'DM Sans'", fontSize: 10, letterSpacing: 3, color: "rgba(26,26,46,0.25)", textTransform: "uppercase" }}>{item.l}</span>
                    <span style={{ fontFamily: "'DM Sans'", fontSize: 15, color: "rgba(26,26,46,0.6)" }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </Anim>
          </div>
          <Anim d={0.1}>
            <div className="cfi" style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: 16 }}>
              <input type="text" placeholder="Adınız Soyadınız" />
              <input type="email" placeholder="E-posta Adresiniz" />
              <input type="text" placeholder="Firma Adı" />
              <input type="text" placeholder="İlgilendiğiniz Hibe Programı" />
              <textarea placeholder="Projeniz hakkında kısa bilgi..." rows={4} />
              <button className="cf" style={{ alignSelf: "flex-start" }}>Gönder</button>
            </div>
          </Anim>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "64px 56px 32px", borderTop: "1px solid rgba(26,26,46,0.06)", background: "#fff" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Logo s={22} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 400, letterSpacing: 1, color: "#1a1a2e" }}>
                  Grant<em style={{ color: "#0ABAB5", fontStyle: "italic" }}>IQ</em>ue
                </span>
              </div>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "rgba(26,26,46,0.3)", maxWidth: 280, lineHeight: 1.7 }}>Proje Geliştirme & Danışmanlık<br />CareVia LTD bünyesinde bir markadır.</p>
            </div>
            <div style={{ display: "flex", gap: 64 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: 4, color: "rgba(26,26,46,0.2)", textTransform: "uppercase", marginBottom: 20 }}>Sayfalar</div>
                {SECTIONS.map(s => (
                  <button key={s} onClick={() => go(s)} style={{ display: "block", background: "none", border: "none", color: "rgba(26,26,46,0.35)", fontFamily: "'DM Sans'", fontSize: 13.5, cursor: "pointer", padding: "6px 0", transition: "color .4s" }}
                    onMouseOver={e => e.target.style.color = "#0ABAB5"} onMouseOut={e => e.target.style.color = "rgba(26,26,46,0.35)"}>
                    {navTR[s]}
                  </button>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 9, letterSpacing: 4, color: "rgba(26,26,46,0.2)", textTransform: "uppercase", marginBottom: 20 }}>Programlar</div>
                {["KOSGEB", "TÜBİTAK", "AB Hibeleri", "BM Fonları"].map(p => (
                  <div key={p} style={{ fontFamily: "'DM Sans'", fontSize: 13.5, color: "rgba(26,26,46,0.35)", padding: "6px 0" }}>{p}</div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 64, paddingTop: 24, borderTop: "1px solid rgba(26,26,46,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "rgba(26,26,46,0.15)" }}>© 2026 GrantIQue — CareVia LTD. Tüm hakları saklıdır.</span>
            <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "rgba(26,26,46,0.15)" }}>İstanbul, Türkiye</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
