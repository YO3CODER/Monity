"use client";

import Link from "next/link";
import {
  ArrowRight, Zap, Smartphone, Download, Share2,
  CheckCircle, FileText,
} from "lucide-react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";

// ─── LANDING PAGE DATA ──────────────────────────────────────────────────────

const STATS = [
  { num: "3 min", label: "Pour créer une facture" },
  { num: "100%", label: "Gratuit, aucun frais caché" },
  { num: "PDF", label: "Export professionnel illimité" },
  { num: "0 F", label: "Aucun abonnement" },
];

const STEPS = [
  {
    num: "01", icon: FileText,
    title: "Renseignez votre facture",
    desc: "Client, articles, quantités, montants — remplissez chaque section en quelques clics, avec calcul automatique du total.",
  },
  {
    num: "02", icon: Zap,
    title: "Vérifiez en temps réel",
    desc: "Votre facture s'affiche telle qu'elle sera exportée, section par section, sans surprise au moment du téléchargement.",
  },
  {
    num: "03", icon: Download,
    title: "Téléchargez votre PDF",
    desc: "Récupérez instantanément une facture PDF professionnelle, prête à envoyer à vos clients ou à archiver.",
  },
];

const FEATURES = [
  { icon: Smartphone, title: "100% mobile-friendly",     desc: "Créez et téléchargez vos factures depuis votre smartphone, sans rien installer." },
  { icon: Zap,        title: "Aperçu en temps réel",      desc: "Chaque champ rempli met à jour l'aperçu immédiatement, sans étape de génération séparée." },
  { icon: FileText,   title: "Export PDF professionnel",  desc: "Téléchargez une facture PDF nette, prête à envoyer à vos clients ou à archiver." },
  { icon: Share2,     title: "Partage instantané",         desc: "Envoyez votre facture par WhatsApp, email ou toute autre application dès le téléchargement." },
  { icon: Download,   title: "Téléchargement illimité",    desc: "Créez et téléchargez autant de factures que vous voulez, sans restriction." },
  { icon: CheckCircle,title: "100% gratuit",                desc: "Aucun engagement, aucun compte premium, aucun paiement requis." },
];

// ─── AUTH-AWARE CTA ─────────────────────────────────────────────────────────
// Affiche un lien vers /dashboard si l'utilisateur est connecté,
// sinon ouvre le modal de connexion Clerk.

function AuthCTA({
  className,
  style,
  loggedOutLabel,
  loggedInLabel,
}: {
  className?: string;
  style?: CSSProperties;
  loggedOutLabel: ReactNode;
  loggedInLabel?: ReactNode;
}) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className={className} style={style}>
        {loggedInLabel ?? loggedOutLabel}
      </Link>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className={className} style={style}>
        {loggedOutLabel}
      </button>
    </SignInButton>
  );
}

// ─── INVOICE MOCKUP (hero signature element) ───────────────────────────────

function InvoiceMockup() {
  return (
    <div className="relative w-full max-w-xs mx-auto">
      <div
        className="absolute -right-8 top-4 z-10 flex items-center gap-2 rounded-full border border-accent/20 bg-white px-3 py-1.5 text-xs font-medium shadow-lg"
        style={{ animationName: "floatUp", animationDuration: "4s", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" }}
      >
        <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
        Facture téléchargée
      </div>
      <div
        className="absolute -left-10 bottom-8 z-10 flex items-center gap-2 rounded-full border border-accent/20 bg-white px-3 py-1.5 text-xs font-medium shadow-lg"
        style={{ animationName: "floatDown", animationDuration: "4.5s", animationIterationCount: "infinite", animationTimingFunction: "ease-in-out" }}
      >
        <Share2 className="w-3 h-3 text-accent" />
        Prête à envoyer
      </div>

      <div className="rounded-2xl overflow-hidden shadow-2xl border border-accent/20 bg-white -rotate-2">
        <div className="h-14 flex items-center justify-between px-5 bg-accent">
          <div className="h-2.5 w-16 rounded-full bg-white/80" />
          <div className="h-6 w-6 rounded-full bg-white/30" />
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-20 rounded-full bg-gray-200" />
              <div className="h-1.5 w-14 rounded-full bg-gray-100" />
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              <div className="h-1.5 w-16 rounded-full bg-gray-200" />
              <div className="h-1.5 w-10 rounded-full bg-gray-100" />
            </div>
          </div>
          <div className="h-px w-full bg-gray-100" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-1.5 rounded-full bg-gray-100" style={{ width: `${60 - i * 8}%` }} />
              <div className="font-mono text-[10px] text-gray-400">{(12000 + i * 4500).toLocaleString("fr-FR")} F</div>
            </div>
          ))}
          <div className="h-px w-full bg-gray-100" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-ink">Total</span>
            <span className="font-mono text-sm font-bold text-accent">25 500 F</span>
          </div>
        </div>
        <div
          className="absolute right-6 bottom-16 border-2 border-accent text-accent rounded px-2 py-1 text-[10px] font-bold tracking-widest rotate-[-12deg] opacity-90"
          style={{ animationName: "stampIn", animationDuration: "1.4s", animationDelay: ".6s", animationFillMode: "backwards" }}
        >
          PDF
        </div>
      </div>
    </div>
  );
}

// ─── REVEAL HOOK ────────────────────────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = "1";
          (e.target as HTMLElement).style.transform = "none";
        }
      }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ─── PAGE (landing publique, toujours affichée sur "/") ────────────────────

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  useReveal();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,900;1,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');

        :root {
          --paper: #fffdf7;
          --ink:   #1c1917;
          --muted: #6b6255;
        }

        .landing-root { background: var(--paper); font-family: 'Inter', sans-serif; color: var(--ink); }
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .6s ease, transform .6s ease;
        }

        @keyframes floatUp   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes floatDown { 0%,100% { transform: translateY(0); } 50% { transform: translateY(7px); } }
        @keyframes fadeUp    { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes stampIn   {
          0%   { opacity: 0; transform: rotate(-12deg) scale(1.6); }
          70%  { opacity: 1; transform: rotate(-12deg) scale(0.94); }
          100% { opacity: 0.9; transform: rotate(-12deg) scale(1); }
        }

        .animate-fade-up { animation: fadeUp .65s ease both; }
      `}</style>

      <div className="landing-root">
        {/* ── NAV ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] h-16 border-b border-accent/15 backdrop-blur-md bg-[rgba(255,253,247,.92)]">
          <span className="font-display text-2xl italic tracking-tight">
            In<span className="text-accent">Voice</span>
          </span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#comment-ca-marche" className="text-sm text-muted-foreground transition-colors hover:text-ink">
              Comment ça marche
            </a>
            <a href="#gratuit" className="text-sm text-muted-foreground transition-colors hover:text-ink">
              Gratuit
            </a>
            <a href="#fonctionnalites" className="text-sm text-muted-foreground transition-colors hover:text-ink">
              Fonctionnalités
            </a>
          </div>
          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full px-5 py-2 text-sm font-medium text-white bg-accent transition-all hover:-translate-y-px hover:brightness-90 active:scale-95"
              >
                Tableau de bord
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-muted-foreground transition-colors hover:text-ink">
                    Se connecter
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="rounded-full px-5 py-2 text-sm font-medium text-white bg-accent transition-all hover:-translate-y-px hover:brightness-90 active:scale-95">
                    Créer une facture
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-24 pb-16 px-[5vw]">
          <div className="pointer-events-none absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-accent/[.08] blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/[.06] blur-[80px]" />

          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium mb-7 text-accent">
            <span className="w-2 h-2 rounded-full inline-block bg-accent" style={{ animation: "pulse 2s infinite" }} />
            100% gratuit · Sans engagement
          </div>

          <h1 className="font-display font-black leading-[1.06] tracking-tight animate-fade-up"
            style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)", animationDelay: ".1s", maxWidth: 820 }}>
            Vos factures,{" "}
            <em className="text-accent not-italic">prêtes en quelques minutes.</em>
          </h1>

          <p className="mt-6 leading-relaxed text-muted-foreground animate-fade-up"
            style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", maxWidth: 540, animationDelay: ".2s" }}>
            InVoice vous guide dans la création de vos factures professionnelles.
            Créez et téléchargez, gratuitement, sans limite.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center animate-fade-up" style={{ animationDelay: ".3s" }}>
            <AuthCTA
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-medium text-white bg-accent shadow-none transition-all hover:-translate-y-0.5 hover:brightness-90 hover:shadow-[0_8px_28px_rgba(180,83,9,.3)] active:scale-95"
              loggedOutLabel={<>Commencer maintenant <ArrowRight className="w-4 h-4" /></>}
              loggedInLabel={<>Aller à mon tableau de bord <ArrowRight className="w-4 h-4" /></>}
            />
            <a href="#comment-ca-marche"
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 text-ink px-8 py-3.5 text-base font-medium transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent">
              Voir comment ça marche
            </a>
          </div>

          <div className="mt-16 w-full max-w-sm animate-fade-up" style={{ animationDelay: ".45s" }}>
            <InvoiceMockup />
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="flex flex-wrap justify-center border-y border-accent/10 bg-white">
          {STATS.map(({ num, label }, i) => (
            <div key={i} className="reveal flex-1 min-w-[140px] max-w-[220px] text-center py-8 px-4 border-r border-accent/10 last:border-r-0"
              style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="font-mono font-bold text-3xl leading-none text-accent">{num}</div>
              <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="px-[5vw] py-24" id="comment-ca-marche">
          <div className="reveal">
            <p className="text-xs font-medium uppercase tracking-widest mb-3 text-accent">Comment ça marche</p>
            <h2 className="font-display font-black leading-tight tracking-tight"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)", maxWidth: 560 }}>
              Trois étapes.{" "}<em className="text-accent not-italic">Une facture prête à envoyer.</em>
            </h2>
          </div>
          <div className="grid gap-5 mt-14" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <div key={i} className="reveal rounded-2xl border border-accent/15 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="font-display font-black text-5xl leading-none mb-4 select-none text-accent/10">{num}</div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 bg-accent/10">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <p className="font-medium mb-2">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── GRATUIT ── */}
        <section className="px-[5vw] py-24 bg-white" id="gratuit">
          <div className="reveal text-center max-w-2xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-widest mb-3 text-accent">100% gratuit</p>
            <h2 className="font-display font-black leading-tight tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
              Créez et téléchargez,{" "}<em className="text-accent not-italic">sans jamais payer.</em>
            </h2>
            <p className="mt-4 leading-relaxed text-base text-muted-foreground">
              Aucune limite à la création. Aucun abonnement. Aucun paiement requis, même pour télécharger.
            </p>
          </div>

          <div className="reveal rounded-2xl border-2 border-accent bg-white p-8 mt-14 max-w-xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-widest mb-2 text-accent">Votre plan</div>
            <p className="text-3xl font-black mb-2">Gratuit, pour toujours</p>
            <p className="text-sm mb-6 text-muted-foreground">Tout ce qu'il vous faut, sans frais</p>
            <ul className="space-y-3 mb-8">
              {["Nombre de factures illimité", "Aperçu en temps réel", "Export PDF haute qualité", "Partage instantané", "Interface mobile-friendly"].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />{f}
                </li>
              ))}
            </ul>
            <AuthCTA
              className="block w-full text-center py-2.5 px-4 rounded-full text-sm font-medium text-white bg-accent transition-all hover:-translate-y-0.5 hover:brightness-90"
              loggedOutLabel={<>Commencer gratuitement <ArrowRight className="w-4 h-4 inline ml-1" /></>}
              loggedInLabel={<>Aller à mon tableau de bord <ArrowRight className="w-4 h-4 inline ml-1" /></>}
            />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="px-[5vw] py-24" id="fonctionnalites">
          <div className="reveal">
            <p className="text-xs font-medium uppercase tracking-widest mb-3 text-accent">Fonctionnalités</p>
            <h2 className="font-display font-black leading-tight tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 3rem)", maxWidth: 560 }}>
              Tout ce qu'il vous faut,{" "}<em className="text-accent not-italic">rien de superflu.</em>
            </h2>
          </div>
          <div className="grid gap-5 mt-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="reveal rounded-2xl border border-accent/15 bg-white p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-accent/10">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <p className="font-medium mb-1.5">{title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="px-[5vw] py-24 text-center text-white bg-accent">
          <h2 className="font-display font-black leading-tight tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}>
            Prêt(e) à envoyer<br />votre prochaine facture ?
          </h2>
          <p className="mt-4 mx-auto leading-relaxed opacity-85" style={{ maxWidth: 440 }}>
            Créez-la et téléchargez-la gratuitement, dès maintenant.
          </p>
          <AuthCTA
            className="mt-10 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-medium bg-white text-accent transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            loggedOutLabel={<>Créer ma facture gratuitement <ArrowRight className="w-4 h-4" /></>}
            loggedInLabel={<>Aller à mon tableau de bord <ArrowRight className="w-4 h-4" /></>}
          />
        </section>

        {/* ── FOOTER ── */}
        <footer className="flex flex-wrap items-center justify-between gap-4 px-[5vw] py-10 bg-ink">
          <span className="font-display italic text-xl text-white">
            In<span className="text-accent">Voice</span>
          </span>
          <p className="text-xs text-white/40">© 2026 InVoice · Tous droits réservés</p>
          <div className="flex gap-6">
            {["Confidentialité", "Contact"].map((label) => (
              <Link key={label} href="#" className="text-xs text-white/40 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </> 
  );
}