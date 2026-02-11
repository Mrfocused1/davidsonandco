import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bed,
  Calendar,
  Check,
  ChefHat,
  Bath,
  Car,
  Home,
  Loader2,
  MapPin,
  Phone,
  Search,
  Sparkles,
  User,
  X,
  Clock,
  Mail,
} from "lucide-react";

// --- BRAND CONFIG ---
const BRAND_NAME = "48B Westway";
const BRAND_TAGLINE = "Neasden, NW10";

// Davidson & Co color palette
const COLORS = {
  gold: "#C5A059",
  goldDark: "#A08247",
  neutral900: "#171717",
  neutral800: "#262626",
  paper: "#fafafa",
  neutral50: "#fafafa",
};

// ---- Utilities ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute the center point of an element relative to the phone container.
 */
function getTargetPos(container, el) {
  if (!container || !el) return null;
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  return {
    x: e.left - c.left + e.width / 2,
    y: e.top - c.top + e.height / 2,
  };
}

// --- Autoplay hook ---
function useAutoplay(
  containerRef,
  restartToken,
  opts
) {
  const [cursor, setCursor] = useState({ x: 24, y: 120, clicked: false, visible: true });

  useEffect(() => {
    if (!opts.enabled) return;

    let cancelled = false;

    const clickAt = async (id, msBefore = 600) => {
      const container = containerRef.current;
      const el = document.getElementById(id);
      const pos = getTargetPos(container, el);
      if (!pos) return false;

      setCursor((p) => ({ ...p, x: pos.x, y: pos.y }));
      await wait(msBefore);
      if (cancelled) return false;

      setCursor((p) => ({ ...p, clicked: true }));
      el?.click?.();
      await wait(140);
      if (cancelled) return false;
      setCursor((p) => ({ ...p, clicked: false }));
      await wait(180);
      return true;
    };

    const typeInto = async (field, text, minDelay = 25, maxDelay = 55) => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        const chunk = text.slice(0, i);
        opts.setForm((f) => ({ ...f, [field]: chunk }));
        await wait(minDelay + Math.random() * (maxDelay - minDelay));
      }
      await wait(180);
    };

    const run = async () => {
      // hard reset UI back to step 0
      opts.goToStep(0);
      opts.setProcessing(false);
      opts.setToast(null);
      opts.setForm({
        name: "",
        email: "",
        phone: "",
        notes: "",
        roomType: null,
        moveInDate: null,
        tenancyLength: null,
      });
      setCursor({ x: 24, y: 120, clicked: false, visible: true });

      await wait(800);

      // Step 0: Property details - just scroll and view
      await wait(1200);
      await clickAt("btn-next-0", 700);

      // Step 1: Contact details
      await wait(550);
      await clickAt("dc-name");
      await typeInto("name", "James Thompson");

      await clickAt("dc-email");
      await typeInto("email", "james.thompson@email.com");

      await clickAt("dc-phone");
      await typeInto("phone", "07700 900456");

      await clickAt("btn-next-1", 700);

      // Step 2: Room selection
      await wait(650);
      await clickAt("room-double", 700);

      // Step 3: Move-in date & tenancy
      await wait(650);
      await clickAt("date-15", 700);
      await wait(200);
      await clickAt("slot-1", 600);
      await clickAt("btn-next-3", 700);

      // Step 4: Confirmation
      await wait(700);
      await clickAt("btn-confirm", 800);

      // Step 5: Success
      // Loop handled outside
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [restartToken, opts.enabled]);

  return cursor;
}

// --- Small presentational components ---
function Pill({ children, tone }) {
  const cls =
    tone === "gold"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : tone === "ok"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-neutral-100 text-neutral-700 border-neutral-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

function SectionLabel({ children, dark }) {
  return (
    <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${dark ? "text-neutral-400" : "text-neutral-500"}`}>
      {children}
    </div>
  );
}

function Divider({ dark }) {
  return <div className={`h-px w-full ${dark ? "bg-neutral-700/70" : "bg-neutral-200/70"}`} />;
}

function MiniLogo({ size = "small" }) {
  const sizeClass = size === "large" ? "h-10" : "h-9";
  return (
    <div className={`${sizeClass} flex items-center justify-center`}>
      <img
        src="/logo.png"
        alt="Davidson & Co"
        className="h-full w-auto object-contain"
      />
    </div>
  );
}

function PropertyFeature({ icon: Icon, label, value, dark }) {
  return (
    <div className={`flex items-center gap-2 border rounded-sm px-3 py-2 ${
      dark
        ? "bg-neutral-800 border-neutral-700"
        : "bg-white border-neutral-200"
    }`}>
      <Icon className={`w-4 h-4 ${dark ? "text-neutral-400" : "text-neutral-600"}`} />
      <div className="flex-1">
        <div className={`text-[10px] uppercase tracking-wider ${dark ? "text-neutral-400" : "text-neutral-500"}`}>{label}</div>
        <div className={`text-sm font-semibold ${dark ? "text-white" : "text-neutral-900"}`}>{value}</div>
      </div>
    </div>
  );
}

// --- Main Demo App ---
export default function PropertyViewingDemo() {
  const containerRef = useRef(null);

  const [step, setStep] = useState(0);
  const [loopToken, setLoopToken] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    roomType: null,
    moveInDate: null,
    tenancyLength: null,
  });

  const canNext0 = true; // Property details page, always can proceed
  const canNext1 = form.name.trim() && form.email.trim() && form.phone.trim();
  const canNext2 = !!form.roomType;
  const canNext3 = !!form.moveInDate && !!form.tenancyLength;

  const goToStep = (s) => setStep(clamp(s, 0, 5));

  const next = () => setStep((s) => clamp(s + 1, 0, 5));

  const triggerConfirm = () => {
    setProcessing(true);
    setToast(null);
    setTimeout(() => {
      setProcessing(false);
      setToast("Room booking confirmed. Details sent via email.");
      next();
    }, 1400);
  };

  // Autoplay cursor + scripted interactions
  const cursor = useAutoplay(containerRef, loopToken, {
    enabled: autoPlay,
    onStepAdvance: next,
    goToStep,
    step,
    setForm,
    setProcessing,
    triggerConfirm,
    setToast,
  });

  // Loop back after success
  useEffect(() => {
    if (step !== 5) return;
    const t = setTimeout(() => {
      setStep(0);
      setProcessing(false);
      setToast(null);
      setForm({
        name: "",
        email: "",
        phone: "",
        notes: "",
        viewingType: null,
        date: null,
        slot: null,
      });
      setLoopToken((n) => n + 1);
    }, 4200);
    return () => clearTimeout(t);
  }, [step]);

  // Little helper for manual mode
  const manualAdvance = () => {
    if (step === 1 && !canNext1) {
      setToast("Please complete all contact details.");
      return;
    }
    if (step === 2 && !canNext2) {
      setToast("Please select a viewing type.");
      return;
    }
    if (step === 3 && !canNext3) {
      setToast("Please choose a date and time slot.");
      return;
    }
    setToast(null);
    next();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: COLORS.paper }}
    >
      <style>{`:root{--dc-gold:${COLORS.gold};--dc-gold-dark:${COLORS.goldDark};--dc-neutral900:${COLORS.neutral900};}`}</style>

      {/* Subtle grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')",
        }}
      />

      {/* Phone */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-[390px] h-[720px] rounded-[44px] border-8 shadow-2xl overflow-hidden ${
          darkMode
            ? "bg-neutral-900 border-neutral-950"
            : "bg-white border-neutral-900"
        }`}
      >
        {/* Status bar */}
        <div className={`h-7 w-full flex items-center justify-between px-6 pt-3 text-[11px] ${
          darkMode ? "text-neutral-200" : "text-neutral-800"
        }`}>
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-4 h-2.5 rounded-[2px] ${darkMode ? "bg-neutral-200" : "bg-neutral-900"}`} />
            <div className={`w-3 h-2.5 rounded-[2px] ${darkMode ? "bg-neutral-400" : "bg-neutral-700"}`} />
            <div className={`w-5 h-2.5 border rounded-[3px] relative ${darkMode ? "border-neutral-200" : "border-neutral-900"}`}>
              <div className={`absolute inset-0.5 rounded-[2px] ${darkMode ? "bg-neutral-200" : "bg-neutral-900"}`} />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className={`sticky top-0 z-20 backdrop-blur border-b ${
          darkMode
            ? "bg-neutral-900/90 border-neutral-800"
            : "bg-white/90 border-neutral-200"
        }`}>
          <div className="px-6 pt-4 pb-3 flex items-center justify-between gap-3">
            <button
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-sm border ${
                darkMode
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-900"
              }`}
              onClick={() => setAutoPlay((v) => !v)}
              title="Toggle autoplay"
            >
              {autoPlay ? "Auto" : "Manual"}
            </button>

            <div className="flex-1 flex justify-center">
              <MiniLogo size="large" />
            </div>

            <button
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-sm border ${
                darkMode
                  ? "border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                  : "border-neutral-200 hover:bg-neutral-50 text-neutral-900"
              }`}
              onClick={() => setDarkMode((v) => !v)}
              title="Toggle dark mode"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
          </div>

          {/* Progress */}
          <div className="px-6 pb-4">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1/5 rounded-full transition-all duration-500 ${
                    i <= step ? "bg-[color:var(--dc-gold)]" : darkMode ? "bg-neutral-700" : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && step !== 5 && (
          <div className="absolute z-30 left-4 right-4 top-[116px]">
            <div className={`text-xs rounded-sm px-3 py-2 shadow-lg flex items-start justify-between gap-3 ${
              darkMode ? "bg-neutral-800 text-white" : "bg-neutral-900 text-white"
            }`}>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 opacity-90" />
                <span>{toast}</span>
              </div>
              <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Pages */}
        <div className="relative h-[calc(100%-124px)] overflow-y-auto">
          {/* Step 0: Property Details */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              step === 0 ? "opacity-100 translate-x-0" : step > 0 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
            }`}
          >
            {/* Property Image */}
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src="/images/property-front.jpg"
                alt="Property"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Pill tone="gold">
                  <Home className="w-3 h-3" /> Featured Property
                </Pill>
              </div>
            </div>

            <div className="p-6">
              <SectionLabel dark={darkMode}>Available Rooms</SectionLabel>
              <h1 className={`mt-2 text-2xl font-serif font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>
                48B Westway
              </h1>
              <div className={`mt-2 flex items-center gap-2 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                <MapPin className="w-4 h-4" />
                <span>Neasden, NW10 · Near Jubilee Line</span>
              </div>

              <div className={`mt-4 text-2xl font-serif font-bold ${darkMode ? "text-[color:var(--dc-gold)]" : "text-[color:var(--dc-gold)]"}`}>
                From £2,950 pcm
              </div>
              <div className={`text-xs ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                Bills included (exc. electricity)
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <PropertyFeature icon={Bed} label="Bedrooms" value="4" dark={darkMode} />
                <PropertyFeature icon={Bath} label="Bathrooms" value="2 Marble" dark={darkMode} />
                <PropertyFeature icon={ChefHat} label="Kitchens" value="2" dark={darkMode} />
                <PropertyFeature icon={Home} label="Type" value="Split-Level" dark={darkMode} />
              </div>

              <div className={`mt-6 border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-neutral-900"}`}>About this property</h3>
                <p className={`text-sm leading-relaxed ${darkMode ? "text-neutral-300" : "text-neutral-600"}`}>
                  Newly refurbished split-level flat with private garden, two kitchens, and marble
                  bathrooms. Conveniently located near Neasden Station (Jubilee Line). Perfect for
                  professionals seeking modern, comfortable accommodation with bills included.
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <Pill tone="gold">
                  <Sparkles className="w-3 h-3" /> Newly Refurbished
                </Pill>
                <Pill tone="info">
                  <Check className="w-3 h-3" /> Bills Included
                </Pill>
              </div>
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <button
                id="btn-next-0"
                onClick={manualAdvance}
                className="w-full rounded-sm py-4 font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all bg-[color:var(--dc-gold)] text-white hover:bg-[color:var(--dc-gold-dark)] active:scale-[0.99]"
              >
                Book a Room
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 1: Contact Details */}
          <div
            className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
              step === 1 ? "opacity-100 translate-x-0" : step > 1 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
            }`}
          >
            <SectionLabel dark={darkMode}>Contact Information</SectionLabel>
            <h2 className={`mt-2 text-2xl font-serif font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>Your details</h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
              We'll use these details to confirm your viewing appointment.
            </p>

            <div className="mt-6 space-y-4">
              <div className={`border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  Full name
                </label>
                <div className={`flex items-center gap-2 border rounded-sm px-3 py-3 focus-within:ring-2 focus-within:ring-[color:var(--dc-gold)] ${darkMode ? "bg-neutral-900 border-neutral-600" : "bg-white border-neutral-200"}`}>
                  <User className="w-4 h-4 text-neutral-400" />
                  <input
                    id="dc-name"
                    value={form.name}
                    readOnly
                    className={`w-full bg-transparent outline-none font-medium placeholder:text-neutral-500 ${darkMode ? "text-white" : "text-neutral-900"}`}
                    placeholder="e.g. Sarah Mitchell"
                  />
                </div>
              </div>

              <div className={`border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  Email address
                </label>
                <div className={`flex items-center gap-2 border rounded-sm px-3 py-3 focus-within:ring-2 focus-within:ring-[color:var(--dc-gold)] ${darkMode ? "bg-neutral-900 border-neutral-600" : "bg-white border-neutral-200"}`}>
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <input
                    id="dc-email"
                    value={form.email}
                    readOnly
                    type="email"
                    className={`w-full bg-transparent outline-none font-medium placeholder:text-neutral-500 ${darkMode ? "text-white" : "text-neutral-900"}`}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className={`border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  Phone number
                </label>
                <div className={`flex items-center gap-2 border rounded-sm px-3 py-3 focus-within:ring-2 focus-within:ring-[color:var(--dc-gold)] ${darkMode ? "bg-neutral-900 border-neutral-600" : "bg-white border-neutral-200"}`}>
                  <Phone className="w-4 h-4 text-neutral-400" />
                  <input
                    id="dc-phone"
                    value={form.phone}
                    readOnly
                    type="tel"
                    className={`w-full bg-transparent outline-none font-medium placeholder:text-neutral-500 ${darkMode ? "text-white" : "text-neutral-900"}`}
                    placeholder="07700 900123"
                  />
                </div>
              </div>
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <button
                id="btn-next-1"
                onClick={manualAdvance}
                className={`w-full rounded-sm py-4 font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                  canNext1 ? "bg-[color:var(--dc-gold)] text-white hover:bg-[color:var(--dc-gold-dark)] active:scale-[0.99]" : darkMode ? "bg-neutral-800 text-neutral-500" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 2: Room Selection */}
          <div
            className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
              step === 2 ? "opacity-100 translate-x-0" : step > 2 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
            }`}
          >
            <SectionLabel dark={darkMode}>Choose Your Room</SectionLabel>
            <h2 className={`mt-2 text-2xl font-serif font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>48B Westway</h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
              Select your preferred room.
            </p>

            <div className="mt-6 space-y-3">
              <button
                id="room-double"
                onClick={() => {
                  setToast(null);
                  setForm((f) => ({ ...f, roomType: "Double Room - £950/month" }));
                  next();
                }}
                className={`w-full text-left border-2 rounded-sm overflow-hidden transition-all shadow-sm ${
                  form.roomType === "Double Room - £950/month"
                    ? "border-[color:var(--dc-gold)]"
                    : darkMode
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-[color:var(--dc-gold)] hover:bg-amber-50/20"
                }`}
              >
                <div className="relative h-32">
                  <img src="/images/room1.jpg" alt="Double Room" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Pill tone="gold">Available</Pill>
                  </div>
                </div>
                <div className={`p-4 ${darkMode ? "bg-neutral-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>Double Room</div>
                      <div className={`text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                        Spacious room with ensuite · 1st floor
                      </div>
                    </div>
                    <div className="text-[color:var(--dc-gold)] font-bold text-lg">£950/mo</div>
                  </div>
                </div>
              </button>

              <button
                id="room-single"
                onClick={() => {
                  setToast(null);
                  setForm((f) => ({ ...f, roomType: "Single Room - £750/month" }));
                }}
                className={`w-full text-left border rounded-sm overflow-hidden transition-all ${
                  form.roomType === "Single Room - £750/month"
                    ? "border-[color:var(--dc-gold)]"
                    : darkMode
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <div className="relative h-32">
                  <img src="/images/room3.jpg" alt="Single Room" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Pill tone="gold">Available</Pill>
                  </div>
                </div>
                <div className={`p-4 ${darkMode ? "bg-neutral-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>Single Room</div>
                      <div className={`text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                        Cozy room with shared bathroom · Ground floor
                      </div>
                    </div>
                    <div className="text-[color:var(--dc-gold)] font-bold text-lg">£750/mo</div>
                  </div>
                </div>
              </button>

              <button
                id="room-master"
                onClick={() => {
                  setToast(null);
                  setForm((f) => ({ ...f, roomType: "Master Suite - £1,100/month" }));
                }}
                className={`w-full text-left border rounded-sm overflow-hidden transition-all ${
                  form.roomType === "Master Suite - £1,100/month"
                    ? "border-[color:var(--dc-gold)]"
                    : darkMode
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <div className="relative h-32">
                  <img src="/images/room2.jpg" alt="Master Suite" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    <Pill tone="gold">Available</Pill>
                  </div>
                </div>
                <div className={`p-4 ${darkMode ? "bg-neutral-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>Master Suite</div>
                      <div className={`text-sm mt-1 ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
                        Large room with ensuite & private balcony · Top floor
                      </div>
                    </div>
                    <div className="text-[color:var(--dc-gold)] font-bold text-lg">£1,100/mo</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <button
                onClick={manualAdvance}
                className={`w-full rounded-sm py-4 font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                  canNext2 ? "bg-[color:var(--dc-gold)] text-white hover:bg-[color:var(--dc-gold-dark)] active:scale-[0.99]" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 3: Move-in & Tenancy */}
          <div
            className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
              step === 3 ? "opacity-100 translate-x-0" : step > 3 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
            }`}
          >
            <SectionLabel dark={darkMode}>Move-in Details</SectionLabel>
            <h2 className={`mt-2 text-2xl font-serif font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>When would you like to move in?</h2>
            <p className={`mt-2 text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>Select your preferred move-in date and tenancy length.</p>

            <div className={`mt-6 border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-white border-neutral-200"}`}>
              <div className="flex items-center justify-between">
                <div className={`font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>March 2026</div>
                <Pill tone="gold">
                  <Calendar className="w-3 h-3" /> Available Now
                </Pill>
              </div>

              <div className={`mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                {"SMTWTFS".split("").map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-2 text-center text-sm font-medium">
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <div key={d} className={`py-2 ${darkMode ? "text-neutral-600" : "text-neutral-300"}`}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: 16 }, (_, i) => i + 7).map((d) => (
                  <button
                    key={d}
                    id={d === 15 ? "date-15" : `date-${d}`}
                    onClick={() => {
                      setToast(null);
                      setForm((f) => ({ ...f, moveInDate: d }));
                    }}
                    className={`py-2 rounded-full transition-all ${
                      form.moveInDate === d
                        ? "bg-[color:var(--dc-gold)] text-white shadow-sm"
                        : darkMode
                          ? "text-neutral-300 hover:bg-neutral-700"
                          : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className={`mt-4 border rounded-sm p-4 ${darkMode ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
              <div className="flex items-center justify-between">
                <div className={`font-bold ${darkMode ? "text-white" : "text-neutral-900"}`}>Tenancy Length</div>
                <div className={`text-[11px] ${darkMode ? "text-neutral-400" : "text-neutral-500"}`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  Minimum 6 months
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["6 months", "12 months", "18 months"].map((s, idx) => (
                  <button
                    key={s}
                    id={idx === 1 ? "slot-1" : `tenancy-${idx}`}
                    onClick={() => {
                      setToast(null);
                      setForm((f) => ({ ...f, tenancyLength: s }));
                    }}
                    className={`rounded-sm border px-3 py-3 text-sm font-semibold transition-all ${
                      form.tenancyLength === s
                        ? "border-[color:var(--dc-gold)] bg-amber-50 text-neutral-900"
                        : darkMode
                          ? "border-neutral-600 bg-neutral-900 text-neutral-300 hover:bg-neutral-700"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <button
                id="btn-next-3"
                onClick={manualAdvance}
                className={`w-full rounded-sm py-4 font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                  canNext3 ? "bg-[color:var(--dc-gold)] text-white hover:bg-[color:var(--dc-gold-dark)] active:scale-[0.99]" : darkMode ? "bg-neutral-800 text-neutral-500" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                Review booking
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step 4: Review & Confirm */}
          <div
            className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${
              step === 4 ? "opacity-100 translate-x-0" : step > 4 ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10"
            }`}
          >
            <SectionLabel>Confirmation</SectionLabel>
            <h2 className="mt-2 text-2xl font-serif font-bold text-neutral-900">Review your viewing</h2>
            <p className="mt-2 text-sm text-neutral-600">Please check all details before confirming.</p>

            <div className="mt-6 bg-white border border-neutral-200 rounded-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-sm overflow-hidden">
                  <img
                    src="/images/property-front.jpg"
                    alt="Property thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-neutral-900">48B Westway</div>
                  <div className="text-sm text-neutral-600">Neasden, NW10</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill tone="info">
                      <Bed className="w-3 h-3" /> 4 bed
                    </Pill>
                    <Pill tone="info">
                      <Bath className="w-3 h-3" /> 2 bath
                    </Pill>
                  </div>
                </div>
              </div>

              <Divider />

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Viewing type</span>
                  <span className="font-semibold text-neutral-900">{form.viewingType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Date</span>
                  <span className="font-semibold text-neutral-900">Feb {form.date ?? 15}, 2026</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Time</span>
                  <span className="font-semibold text-neutral-900">{form.slot ?? "2pm–3pm"}</span>
                </div>
              </div>

              <Divider />

              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold mb-1">
                  Contact details
                </div>
                <div className="text-sm text-neutral-900">{form.name || "Sarah Mitchell"}</div>
                <div className="text-sm text-neutral-600">{form.email || "sarah.mitchell@email.com"}</div>
                <div className="text-sm text-neutral-600">{form.phone || "07700 900123"}</div>
              </div>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-sm p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-900 text-sm">What to expect</div>
                  <div className="text-xs text-amber-800 mt-1">
                    One of our experienced agents will meet you at the property and guide you through
                    each room, answering any questions you may have.
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-6 right-6 bottom-6">
              <button
                id="btn-confirm"
                onClick={() => {
                  setToast(null);
                  triggerConfirm();
                }}
                disabled={processing}
                className={`w-full rounded-sm py-4 font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                  processing
                    ? "bg-neutral-200 text-neutral-500"
                    : "bg-[color:var(--dc-gold)] text-white hover:bg-[color:var(--dc-gold-dark)] active:scale-[0.99]"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Confirming...
                  </>
                ) : (
                  <>
                    Confirm viewing
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
              <div className="mt-2 text-[10px] text-neutral-500 text-center">
                You'll receive a confirmation email and calendar invite.
              </div>
            </div>
          </div>

          {/* Step 5: Success */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              step === 5 ? "opacity-100 scale-100" : "opacity-0 scale-[0.98] pointer-events-none"
            }`}
            style={{ background: COLORS.neutral900 }}
          >
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 text-white">
              <div className="w-28 h-28 rounded-full bg-white/15 flex items-center justify-center relative">
                <div className="w-20 h-20 rounded-sm bg-white flex items-center justify-center p-2">
                  <img
                    src="/logo.png"
                    alt="Davidson & Co"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[color:var(--dc-gold)] rounded-full p-2 border-4" style={{ borderColor: COLORS.neutral900 }}>
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="mt-6 text-3xl font-serif font-bold">Booking confirmed</div>
              <div className="mt-2 text-neutral-200 text-lg">
                Your room at <span className="font-semibold">48B Westway</span> is reserved.{" "}
                <span className="font-semibold">Move-in: Mar {form.moveInDate ?? 15}</span>
              </div>

              <div className="mt-6 bg-white/10 backdrop-blur rounded-sm p-4 w-full text-left">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-sm bg-white flex items-center justify-center">
                    <Calendar className="w-6 h-6" style={{ color: COLORS.neutral900 }} />
                  </div>
                  <div>
                    <div className="font-bold">Confirmation email sent</div>
                    <div className="text-xs text-neutral-300">Check your email for tenancy agreement and move-in details.</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-[11px] text-neutral-400">
                Questions? Call us at 020 7123 4567
              </div>
            </div>
          </div>
        </div>

        {/* Navigation indicator */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="h-1.5 w-32 bg-neutral-200 rounded-full" />
        </div>

        {/* Simulated cursor (only when autoplay is on) */}
        {autoPlay && (
          <div
            className="absolute top-0 left-0 pointer-events-none z-50 transition-transform duration-[650ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 32 32"
              fill="none"
              className={`drop-shadow-xl transition-transform duration-150 ${cursor.clicked ? "scale-90" : "scale-100"}`}
            >
              <path
                d="M6 4L24 20L15.5 21.5L20.5 30L17 32L11.5 22.5L6 27V4Z"
                fill="#171717"
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className={`absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-neutral-900 opacity-0 transition-all duration-300 ${
                cursor.clicked ? "animate-ping opacity-100" : ""
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
