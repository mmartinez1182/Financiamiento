import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator, Car, MessageCircle, FileCheck2, Menu, X, MapPin, Gauge, Store,
  Layers, Wallet, Scale, PhoneCall, IdCard, Home, Receipt, History, PiggyBank, User,
  ChevronDown, ArrowRight, Info,
} from "lucide-react";
import { track } from "@/lib/analytics";
import hero from "@/assets/hero.jpg";
import cx30 from "@/assets/car-cx30.jpg";
import sedan from "@/assets/car-sedan.jpg";
import pickup from "@/assets/car-pickup.jpg";
import hatch from "@/assets/car-hatch.jpg";

const TITLE = "Financiamiento de autos seminuevos | Seminuevos.com México";
const DESC = "Descubre qué auto se adapta a tu presupuesto. Calcula una mensualidad estimada y explora autos publicados por agencias y dealers.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/* ---------- helpers ---------- */
// Illustrative parameter only — NOT a real rate from any institution.
const ILLUSTRATIVE_ANNUAL_RATE = 0.15;
const mxn = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");
function monthly(price: number, downPct: number, months: number) {
  const principal = price * (1 - downPct / 100);
  const r = ILLUSTRATIVE_ANNUAL_RATE / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

type Vehicle = {
  id: number; brand: string; model: string; year: number; price: number;
  city: string; km: number; dealer: string; img: string; type: string;
};
const VEHICLES: Vehicle[] = [
  { id: 1, brand: "Volkswagen", model: "Polo", year: 2022, price: 189000, city: "Puebla", km: 38000, dealer: "Autos del Valle", img: hatch, type: "Hatchback" },
  { id: 2, brand: "Toyota", model: "Corolla", year: 2021, price: 279000, city: "Guadalajara", km: 52000, dealer: "Agencia Occidente", img: sedan, type: "Sedán" },
  { id: 3, brand: "Mazda", model: "CX-30", year: 2023, price: 389000, city: "Ciudad de México", km: 45000, dealer: "Agencia XYZ", img: cx30, type: "Monovolumen" },
  { id: 4, brand: "Nissan", model: "Frontier", year: 2022, price: 529000, city: "Querétaro", km: 61000, dealer: "Dealer Bajío", img: pickup, type: "Pickup" },
  { id: 5, brand: "Volkswagen", model: "Polo Comfortline", year: 2021, price: 168000, city: "Monterrey", km: 47000, dealer: "Seminuevos Norte", img: hatch, type: "Hatchback" },
  { id: 6, brand: "Toyota", model: "Corolla Hybrid", year: 2023, price: 359000, city: "Ciudad de México", km: 22000, dealer: "Toyota Satélite", img: sedan, type: "Híbrido" },
  { id: 7, brand: "Mazda", model: "CX-30 Grand Touring", year: 2024, price: 469000, city: "Mérida", km: 15000, dealer: "Mazda Península", img: cx30, type: "Monovolumen" },
  { id: 8, brand: "Nissan", model: "Frontier PRO-4X", year: 2024, price: 689000, city: "León", km: 18000, dealer: "Grupo Automotriz León", img: pickup, type: "Pickup" },
];

const RANGES = [
  { label: "Hasta $200,000", min: 0, max: 200000 },
  { label: "$200,000 – $300,000", min: 200000, max: 300000 },
  { label: "$300,000 – $400,000", min: 300000, max: 400000 },
  { label: "$400,000 – $600,000", min: 400000, max: 600000 },
  { label: "Más de $600,000", min: 600000, max: Infinity },
];
const TYPES = ["Sedán", "Hatchback", "Monovolumen", "Pickup", "Híbrido", "Eléctrico"];

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

/* ---------- shared UI ---------- */
const btn = "inline-flex items-center justify-center gap-2 rounded-full px-6 h-12 text-[15px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]";
const btnPrimary = `${btn} bg-primary text-primary-foreground hover:brightness-95 shadow-soft`;
const btnGhost = `${btn} border border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted`;
const btnInverse = `${btn} bg-background text-primary hover:bg-primary-soft`;
const btnInverseGhost = `${btn} border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10`;

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`text-xl font-extrabold tracking-tight ${inverse ? "text-background" : "text-ink"}`}>
      seminuevos<span className="text-primary">.com</span>
    </span>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-primary mb-3">{eyebrow}</p>}
      <h2 className="text-3xl md:text-[2.6rem] md:leading-[1.1] font-bold text-ink">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ---------- page ---------- */
function Landing() {
  const [price, setPrice] = useState(389000);
  const [down, setDown] = useState(20);
  const [term, setTerm] = useState(48);
  const [range, setRange] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => { track("financing_landing_view"); }, []);

  const touch = () => {
    if (!started.current) { started.current = true; track("financing_calculator_start"); }
  };

  const pay = monthly(price, down, term);

  const filtered = useMemo(() => {
    let list = VEHICLES;
    if (range !== null) list = list.filter((v) => v.price >= RANGES[range].min && v.price < RANGES[range].max);
    if (type) list = list.filter((v) => v.type === type);
    return list.slice(0, 4);
  }, [range, type]);

  const applyBudget = () => {
    const idx = RANGES.findIndex((r) => price >= r.min && price < r.max);
    setRange(idx); setType(null);
    track("financing_calculator_complete", { price, down, term });
    scrollTo("autos");
  };

  return (
    <div className="pb-24 md:pb-0">
      <Header />
      <HeroSection />
      <Simulator {...{ price, setPrice, down, setDown, term, setTerm, pay, touch, applyBudget }} />
      <Vehicles list={filtered} down={down} term={term} range={range} type={type}
        clear={() => { setRange(null); setType(null); }} />
      <HowItWorks />
      <Benefits />
      <QuickFilters range={range} type={type}
        pickRange={(i) => { setRange(i); setType(null); track("financing_budget_selected", { range: RANGES[i].label }); scrollTo("autos"); }}
        pickType={(t) => { setType(t); setRange(null); track("financing_budget_selected", { type: t }); scrollTo("autos"); }} />
      <Requirements />
      <Education />
      <Faq />
      <FinalCta />
      <Footer />
      <MobileStickyCta />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [["Buscar autos", "autos"], ["¿Cómo funciona?", "como-funciona"], ["Preguntas frecuentes", "faq"]];
  return (
    <header className={`sticky top-0 z-40 bg-background/90 backdrop-blur transition-shadow ${scrolled ? "shadow-soft" : ""}`}>
      <div className="mx-auto max-w-7xl px-5 h-16 md:h-[72px] flex items-center justify-between gap-4">
        <a href="#" aria-label="Seminuevos.com"><Logo /></a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map(([l, id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="text-[15px] font-medium text-foreground/80 hover:text-primary transition-colors">{l}</button>
          ))}
          <button onClick={() => scrollTo("autos")} className={`${btnPrimary} h-11`}>Ver autos disponibles</button>
        </nav>
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => scrollTo("autos")} className={`${btnPrimary} h-10 px-4 text-sm`}>Ver autos</button>
          <button onClick={() => setOpen(!open)} aria-label="Menú" className="h-10 w-10 grid place-items-center rounded-full hover:bg-muted">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border px-5 py-3 flex flex-col">
          {links.map(([l, id]) => (
            <button key={id} onClick={() => { setOpen(false); scrollTo(id); }} className="text-left py-3 text-base font-medium">{l}</button>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-8 md:pt-16 pb-16 md:pb-24 grid md:grid-cols-[55fr_45fr] gap-10 md:gap-14 items-center">
      <div>
        <p className="text-xs font-bold tracking-[0.14em] text-primary">FINANCIAMIENTO PARA TU PRÓXIMO AUTO</p>
        <h1 className="mt-4 text-[2.5rem] leading-[1.05] md:text-6xl md:leading-[1.02] font-extrabold text-ink">
          Encuentra un auto que se adapte a <span className="text-primary">tu presupuesto</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl">
          Explora miles de autos seminuevos publicados por agencias y dealers y conoce las opciones de financiamiento disponibles.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={() => scrollTo("autos")} className={btnPrimary}>Explorar autos <ArrowRight className="h-4 w-4" /></button>
          <button onClick={() => scrollTo("simulador")} className={btnGhost}><Calculator className="h-4 w-4" /> Calcular mi presupuesto</button>
        </div>
        <p className="mt-6 flex gap-2 text-xs text-muted-foreground max-w-lg">
          <Info className="h-4 w-4 shrink-0 mt-px" />
          Seminuevos.com es un portal de anuncios. Los vehículos y opciones de financiamiento son ofrecidos por los vendedores o instituciones participantes.
        </p>
      </div>
      <div className="relative">
        <div className="overflow-hidden rounded-3xl aspect-[4/5] md:aspect-[6/7]">
          <img src={hero} alt="Pareja revisando un auto seminuevo en una agencia" width={1200} height={1408} className="h-full w-full object-cover" />
        </div>
        <div className="absolute left-3 md:-left-8 top-6 rounded-2xl bg-card shadow-lift px-4 py-3">
          <p className="text-xs text-muted-foreground">Mazda CX-30 2023</p>
          <p className="text-lg font-bold text-ink">$389,000 MXN</p>
        </div>
        <div className="absolute right-3 md:-right-6 bottom-6 rounded-2xl bg-card shadow-lift p-4 w-56">
          <p className="text-xs text-muted-foreground">Mensualidad estimada desde</p>
          <p className="text-2xl font-extrabold text-primary">{mxn(monthly(389000, 20, 60))}<span className="text-sm font-semibold text-muted-foreground"> /mes</span></p>
          <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Ejemplo ilustrativo</p>
        </div>
      </div>
    </section>
  );
}

function Simulator(p: {
  price: number; setPrice: (n: number) => void; down: number; setDown: (n: number) => void;
  term: number; setTerm: (n: number) => void; pay: number; touch: () => void; applyBudget: () => void;
}) {
  const fill = ((p.price - 150000) / 850000) * 100;
  const downAmt = p.price * p.down / 100;
  return (
    <section id="simulador" className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead eyebrow="SIMULADOR DE PRESUPUESTO" title="¿Cuánto quieres pagar al mes?" sub="Haz una estimación y encuentra autos que podrían ajustarse a tu presupuesto." />
        <div className="mt-10 grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-3xl bg-card p-6 md:p-8 shadow-soft space-y-9">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="price" className="font-semibold text-ink">Precio aproximado del auto</label>
                <div className="flex items-center rounded-xl border border-input px-3 h-11 focus-within:ring-2 focus-within:ring-ring">
                  <span className="text-muted-foreground">$</span>
                  <input aria-label="Precio" inputMode="numeric" value={p.price.toLocaleString("es-MX")}
                    onChange={(e) => { p.touch(); const n = Number(e.target.value.replace(/\D/g, "")); p.setPrice(Math.min(1000000, n)); }}
                    onBlur={() => p.setPrice(Math.max(150000, p.price))}
                    className="w-28 bg-transparent text-right font-bold outline-none" />
                </div>
              </div>
              <input id="price" type="range" min={150000} max={1000000} step={5000} value={p.price}
                onChange={(e) => { p.touch(); p.setPrice(+e.target.value); }}
                className="range-brand w-full mt-5" style={{ ["--fill" as string]: `${fill}%` }} />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>$150,000</span><span>$1,000,000 MXN</span></div>
            </div>
            <div>
              <div className="flex justify-between"><span className="font-semibold text-ink">Enganche</span><span className="font-bold text-primary">{p.down}% · {mxn(downAmt)}</span></div>
              <input type="range" min={10} max={50} step={1} value={p.down} aria-label="Enganche"
                onChange={(e) => { p.touch(); p.setDown(+e.target.value); }}
                className="range-brand w-full mt-5" style={{ ["--fill" as string]: `${((p.down - 10) / 40) * 100}%` }} />
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[10, 20, 30, 40].map((d) => (
                  <button key={d} onClick={() => { p.touch(); p.setDown(d); }}
                    className={`h-11 rounded-xl text-sm font-semibold border transition-colors ${p.down === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-foreground/30"}`}>{d}%</button>
                ))}
              </div>
            </div>
            <div>
              <span className="font-semibold text-ink">Plazo</span>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {[12, 24, 36, 48, 60].map((t) => (
                  <button key={t} onClick={() => { p.touch(); p.setTerm(t); }}
                    className={`h-14 rounded-xl border transition-colors flex flex-col items-center justify-center ${p.term === t ? "bg-ink text-background border-ink" : "border-border hover:border-foreground/30"}`}>
                    <span className="font-bold">{t}</span><span className="text-[11px] opacity-70">meses</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-3xl bg-card p-6 md:p-8 shadow-soft flex flex-col border-t-4 border-primary">
            <p className="font-semibold text-muted-foreground">Mensualidad estimada</p>
            <p key={Math.round(p.pay)} className="mt-2 text-5xl md:text-6xl font-extrabold text-ink animate-in fade-in duration-300">
              {mxn(p.pay)}<span className="text-lg font-semibold text-muted-foreground"> MXN / mes</span>
            </p>
            <dl className="mt-8 divide-y divide-border">
              {[["Precio del vehículo", p.price], ["Enganche estimado", downAmt], ["Monto aproximado a financiar", p.price - downAmt]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-3.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold text-ink">{mxn(v as number)}</dd></div>
              ))}
            </dl>
            <button onClick={p.applyBudget} className={`${btnPrimary} mt-6 w-full`}>Ver autos dentro de este presupuesto <ArrowRight className="h-4 w-4" /></button>
            <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
              Esta simulación es únicamente informativa. La mensualidad, tasa, enganche, plazo y aprobación final dependen de la institución financiera, dealer o agencia correspondiente. Cálculo con parámetros ilustrativos, no representa una tasa real.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Vehicles({ list, down, term, range, type, clear }: { list: Vehicle[]; down: number; term: number; range: number | null; type: string | null; clear: () => void }) {
  const active = range !== null ? RANGES[range].label : type;
  return (
    <section id="autos" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <SectionHead title="Autos que podrían ajustarse a tu presupuesto" sub="Explora vehículos publicados por agencias y dealers en Seminuevos.com." />
          {active && (
            <button onClick={clear} className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-4 h-10 text-sm font-semibold hover:brightness-95">
              {active} <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {list.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No hay autos de ejemplo en esta categoría. <button onClick={clear} className="font-semibold text-primary hover:underline">Ver todos</button>
          </div>
        ) : (
          <div className="mt-10 -mx-5 px-5 flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar md:overflow-visible md:mx-0 md:px-0">
            {list.map((v) => (
              <article key={v.id} onMouseEnter={() => track("financing_vehicle_view", { id: v.id })}
                className="group snap-start shrink-0 w-[80%] sm:w-[45%] md:w-auto rounded-2xl bg-card border border-border overflow-hidden transition-all hover:shadow-lift hover:-translate-y-1">
                <div className="aspect-[3/2] overflow-hidden bg-muted">
                  <img src={v.img} alt={`${v.brand} ${v.model} ${v.year}`} loading="lazy" width={992} height={672} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{v.brand}</p>
                  <h3 className="text-lg font-bold text-ink">{v.model} {v.year}</h3>
                  <p className="mt-2 text-2xl font-extrabold text-ink">{mxn(v.price)} <span className="text-sm font-semibold text-muted-foreground">MXN</span></p>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Gauge className="h-4 w-4" />{v.km.toLocaleString("es-MX")} km</li>
                    <li className="flex items-center gap-2"><MapPin className="h-4 w-4" />{v.city}</li>
                    <li className="flex items-center gap-2"><Store className="h-4 w-4" />{v.dealer}</li>
                  </ul>
                  <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm">Desde <span className="font-bold text-primary">{mxn(monthly(v.price, down, term))}</span> / mes*</p>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button onClick={() => track("financing_vehicle_click", { id: v.id })} className={`${btnPrimary} h-11 w-full`}>Ver auto</button>
                    <button onClick={() => track("financing_dealer_contact_click", { id: v.id, dealer: v.dealer })} aria-label={`Contactar a ${v.dealer}`} className={`${btnGhost} h-11 w-11 px-0`}><PhoneCall className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">*Mensualidad estimada. Consulta condiciones de financiamiento con el vendedor. Autos de ejemplo.</p>
          <button className={btnGhost}>Ver todos los autos <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    [Calculator, "Define tu presupuesto", "Calcula cuánto podrías destinar al enganche y mensualidad."],
    [Car, "Encuentra opciones", "Explora autos publicados por dealers y agencias."],
    [MessageCircle, "Contacta al vendedor", "Solicita información sobre el vehículo y las opciones de financiamiento disponibles."],
    [FileCheck2, "Continúa tu proceso", "El dealer o institución financiera te indicará requisitos, condiciones y aprobación."],
  ] as const;
  return (
    <section id="como-funciona" className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead eyebrow="¿CÓMO FUNCIONA?" title="De tu presupuesto a tu próximo auto" />
        <ol className="relative mt-12 grid md:grid-cols-4 gap-8 md:gap-6">
          <span aria-hidden className="absolute left-7 top-7 bottom-7 w-px bg-border md:left-7 md:right-7 md:top-7 md:bottom-auto md:h-px md:w-auto" />
          {steps.map(([Icon, t, d], i) => (
            <li key={t} className="relative flex md:flex-col gap-5">
              <div className="relative z-10 h-14 w-14 shrink-0 rounded-2xl bg-card shadow-soft grid place-items-center text-primary"><Icon className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-bold text-primary">PASO {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{t}</h3>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    [Layers, "Más opciones para elegir", "Explora vehículos publicados por diferentes agencias y dealers."],
    [Wallet, "Busca según tu presupuesto", "Filtra opciones de acuerdo con el precio que tienes en mente."],
    [Scale, "Compara antes de decidir", "Revisa precios, modelos, años y características."],
    [MessageCircle, "Contacta directamente al vendedor", "Solicita información del vehículo y las alternativas de financiamiento disponibles."],
  ] as const;
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead title="Primero encuentra el auto. Después descubre cómo financiarlo." />
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl border border-border p-6 transition-shadow hover:shadow-soft">
              <div className="h-11 w-11 rounded-xl bg-primary-soft text-primary grid place-items-center"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-5 font-bold text-ink text-lg">{t}</h3>
              <p className="mt-2 text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickFilters({ range, type, pickRange, pickType }: { range: number | null; type: string | null; pickRange: (i: number) => void; pickType: (t: string) => void }) {
  const chip = (on: boolean) => `h-12 px-5 rounded-full border text-[15px] font-semibold whitespace-nowrap transition-colors ${on ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card hover:border-primary hover:text-primary"}`;
  return (
    <section className="bg-muted py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead title="¿Qué estás buscando?" />
        <p className="mt-8 text-sm font-semibold text-muted-foreground">Por presupuesto</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {RANGES.map((r, i) => <button key={r.label} onClick={() => pickRange(i)} className={chip(range === i)}>{r.label}</button>)}
        </div>
        <p className="mt-8 text-sm font-semibold text-muted-foreground">Por categoría</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {TYPES.map((t) => <button key={t} onClick={() => pickType(t)} className={chip(type === t)}>{t}</button>)}
        </div>
      </div>
    </section>
  );
}

function Requirements() {
  const items = [[IdCard, "Identificación oficial"], [Home, "Comprobante de domicilio"], [Receipt, "Comprobante de ingresos"], [History, "Historial crediticio"], [PiggyBank, "Enganche"], [User, "Información personal"]] as const;
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHead title="¿Qué suelen pedir para financiar un auto?" sub="Los requisitos pueden cambiar según el banco, financiera, agencia y perfil del solicitante, pero normalmente pueden solicitarte información como:" />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map(([Icon, t]) => (
            <div key={t} className="rounded-2xl border border-border p-5 flex flex-col gap-4">
              <Icon className="h-6 w-6 text-primary" /><span className="font-semibold text-ink">{t}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 flex gap-2 text-sm text-muted-foreground"><Info className="h-4 w-4 shrink-0 mt-0.5 text-teal" />Consulta los requisitos y condiciones directamente con la institución o dealer que gestione tu financiamiento.</p>
      </div>
    </section>
  );
}

function Education() {
  const tips = [
    ["Enganche", "Un enganche mayor puede reducir el monto que necesitas financiar."],
    ["Plazo", "Un plazo más largo puede reducir la mensualidad, pero puede aumentar el costo total."],
    ["Tasa", "Compara tasas, CAT, comisiones y condiciones."],
    ["Mensualidad", "Busca una mensualidad compatible con tu presupuesto mensual."],
  ];
  return (
    <section className="bg-ink text-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5 grid lg:grid-cols-[1fr_1.4fr] gap-10">
        <div>
          <h2 className="text-3xl md:text-[2.6rem] md:leading-[1.1] font-bold">Antes de elegir financiamiento, compara</h2>
          <button onClick={() => scrollTo("simulador")} className={`${btnPrimary} mt-8`}><Calculator className="h-4 w-4" /> Calcular mi presupuesto</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-px bg-background/10 rounded-2xl overflow-hidden">
          {tips.map(([t, d], i) => (
            <div key={t} className="bg-ink p-6">
              <p className="text-sm font-bold text-primary">0{i + 1}</p>
              <h3 className="mt-2 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-background/70">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  ["¿Seminuevos.com otorga créditos?", "No. Seminuevos.com es un portal de anuncios de vehículos. Las opciones de financiamiento son ofrecidas y gestionadas por dealers, agencias o instituciones financieras."],
  ["¿Seminuevos.com vende los autos?", "No. Los vehículos publicados pertenecen a los vendedores que anuncian su inventario en la plataforma."],
  ["¿La mensualidad que aparece es definitiva?", "No. Las cantidades mostradas son estimaciones. El monto final dependerá del precio del vehículo, enganche, plazo, tasa, perfil crediticio y condiciones de la institución financiera."],
  ["¿Puedo financiar cualquier auto publicado?", "Depende del vehículo, dealer y opciones de financiamiento disponibles. Consulta directamente la publicación para conocer las alternativas."],
  ["¿Qué necesito para solicitar financiamiento?", "Los requisitos dependen de cada institución financiera o dealer. Normalmente pueden solicitar identificación, comprobantes de ingresos, domicilio e información crediticia."],
  ["¿Puedo buscar primero un auto y después consultar financiamiento?", "Sí. Puedes explorar el inventario disponible y después contactar al vendedor para conocer las opciones disponibles."],
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHead title="Preguntas frecuentes" />
        <div className="mt-10 divide-y divide-border border-y border-border">
          {FAQS.map(([q, a], i) => {
            const on = open === i;
            return (
              <div key={q}>
                <button aria-expanded={on} onClick={() => { setOpen(on ? null : i); if (!on) track("financing_faq_open", { q }); }}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left font-semibold text-ink text-lg hover:text-primary transition-colors">
                  {q}<ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${on ? "rotate-180 text-primary" : ""}`} />
                </button>
                <div className={`grid transition-all duration-300 ${on ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}>
                  <p className="overflow-hidden text-muted-foreground">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl rounded-3xl bg-primary text-primary-foreground px-6 py-14 md:p-20 text-center">
        <h2 className="mx-auto max-w-3xl text-3xl md:text-5xl font-extrabold leading-tight">Tu próximo auto puede estar más cerca de lo que imaginas</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/85">Explora opciones dentro de tu presupuesto y encuentra el auto que estás buscando.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => scrollTo("autos")} className={btnInverse}>Ver autos disponibles</button>
          <button onClick={() => scrollTo("simulador")} className={btnInverseGhost}>Calcular mi presupuesto</button>
        </div>
        <p className="mt-8 text-xs text-primary-foreground/70">Los vehículos son publicados y comercializados por terceros.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink text-background">
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Logo inverse />
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-background/75">
            {["Autos usados", "Vender mi auto", "Blog", "Ayuda", "Aviso de privacidad", "Términos y condiciones"].map((l) => (
              <a key={l} href="#" className="hover:text-background">{l}</a>
            ))}
          </nav>
        </div>
        <p className="mt-10 pt-8 border-t border-background/10 text-xs leading-relaxed text-background/60 max-w-4xl">
          Seminuevos.com no es una institución financiera ni otorga créditos. La información presentada en esta página tiene fines informativos. Las condiciones de financiamiento, tasas, plazos, enganches y aprobación están sujetas a las políticas de cada institución financiera, dealer o agencia.
        </p>
      </div>
    </footer>
  );
}

function MobileStickyCta() {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <button onClick={() => scrollTo("autos")} className={`${btnPrimary} w-full`}>Ver autos</button>
      <button onClick={() => scrollTo("simulador")} className="mt-1.5 w-full text-center text-sm font-semibold text-primary py-1">Calcular mensualidad</button>
    </div>
  );
}
