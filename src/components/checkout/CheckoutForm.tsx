"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CreditCard, Landmark, Loader2, Lock, RefreshCw, ShieldCheck, Tag, Wallet } from "lucide-react";
import PargoPickupSelector from "@/components/checkout/PargoPickupSelector";
import { useCart } from "@/components/storefront/CartProvider";
import { ProductImage } from "@/components/storefront/ProductImage";
import { fetchJson, newIdempotencyKey } from "@/lib/client-fetch";
import { DELIVERY_OPTIONS, PROVINCES } from "@/lib/constants";
import { trackInitiateCheckout } from "@/lib/tracking/pixels";
import { cn, formatZAR } from "@/lib/utils";
import type { DeliveryMethod, PaymentGateway, PickupPoint, PublicSettings, Quote } from "@/types";

interface Props {
  settings: PublicSettings;
  gateways: PaymentGateway[];
}

const GATEWAY_INFO: Record<PaymentGateway, { title: string; text: string; Icon: typeof CreditCard }> = {
  YOCO: { title: "Card payment", text: "Visa, Mastercard, Apple Pay & Google Pay — secured by Yoco", Icon: CreditCard },
  PAYFAST: { title: "Payfast", text: "Card, Instant EFT, SnapScan, Mobicred & more", Icon: Wallet },
  EFT: { title: "Manual EFT", text: "Pay by bank transfer. We ship once funds reflect.", Icon: Landmark },
};

type Errors = Record<string, string>;

export function CheckoutForm({ settings, gateways }: Props) {
  const { items, ready } = useCart();
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("PARGO_PICKUP_POINT");
  const [address, setAddress] = useState({ street: "", suburb: "", city: "", province: "", postalCode: "" });
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);
  const [gateway, setGateway] = useState<PaymentGateway | null>(gateways[0] ?? null);
  const [notes, setNotes] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | undefined>(undefined);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const trackedRef = useRef(false);
  // Duplicate-payment guards: one in-flight submit, and one idempotency key per
  // distinct checkout payload (a retry of the same payload reuses its key).
  const submittingRef = useRef(false);
  const attemptRef = useRef<{ key: string; payload: string } | null>(null);

  const cartPayload = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
  const cartKey = JSON.stringify(cartPayload);

  // Authoritative pricing from the server whenever the bag, delivery or code changes.
  useEffect(() => {
    if (!ready || cartPayload.length === 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setQuoting(true);
      const result = await fetchJson<Quote>("/api/checkout/quote", {
        body: { items: cartPayload, deliveryMethod, discountCode: appliedCode },
        timeoutMs: 10_000,
        retries: 2, // a quote is read-only, so retrying is always safe
        signal: controller.signal,
      });
      if (result.ok) {
        setQuote(result.data);
        setQuoteError(null);
      } else if (result.code !== "ABORTED") {
        setQuoteError(result.message);
      }
      if (!controller.signal.aborted) setQuoting(false);
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cartKey, deliveryMethod, appliedCode, quoteAttempt]);

  useEffect(() => {
    if (!ready || trackedRef.current || items.length === 0) return;
    trackedRef.current = true;
    trackInitiateCheckout({
      value: items.reduce((s, i) => s + i.price * i.quantity, 0),
      items: items.map((i) => ({ id: i.variantId, name: i.name, price: i.price, quantity: i.quantity })),
    });
  }, [ready, items]);

  const selectPoint = useCallback((point: PickupPoint) => {
    setPickupPoint(point);
    setErrors((e) => ({ ...e, pickupPoint: "" }));
  }, []);

  if (!ready) return <div className="h-96 animate-pulse bg-ink-800/60" />;

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-24 text-center">
        <h2 className="font-serif text-3xl text-white">Your bag is empty</h2>
        <p className="text-zinc-500">Add something beautiful before checking out.</p>
        <Link href="/shop" className="btn-gold mt-2">Shop the collection</Link>
      </div>
    );
  }

  const fieldError = (key: string) => errors[key] && <p className="field-error">{errors[key]}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateway || submittingRef.current) return; // ignore double clicks / double Enter
    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    const payload = {
      items: cartPayload,
      deliveryMethod,
      discountCode: appliedCode,
      customer,
      gateway,
      address: deliveryMethod === "PARGO_PICKUP_POINT" ? undefined : address,
      pickupPoint: deliveryMethod === "PARGO_PICKUP_POINT" ? pickupPoint ?? undefined : undefined,
      notes: notes || undefined,
      marketingOptIn,
    };
    const payloadKey = JSON.stringify(payload);
    if (!attemptRef.current || attemptRef.current.payload !== payloadKey) {
      attemptRef.current = { key: newIdempotencyKey(), payload: payloadKey };
    }

    const fail = (message: string, fieldErrors: Errors = {}) => {
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
      submittingRef.current = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    type CheckoutResponse =
      | { ok: true; type: "redirect"; url: string; alreadyPaid?: boolean }
      | { ok: true; type: "payfast"; action: string; fields: Record<string, string> };

    // Safe to retry: the server de-duplicates on the Idempotency-Key.
    const send = () =>
      fetchJson<CheckoutResponse>("/api/checkout", {
        body: payload,
        headers: { "Idempotency-Key": attemptRef.current!.key },
        timeoutMs: 30_000,
        retries: 1,
      });

    let result = await send();
    if (!result.ok && result.data?.retryWithNewKey) {
      attemptRef.current = { key: newIdempotencyKey(), payload: payloadKey };
      result = await send();
    }

    if (!result.ok) {
      fail(result.message, (result.data?.errors as Errors | undefined) ?? {});
      return;
    }

    const data = result.data;
    if (data.type === "payfast") {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      for (const [name, value] of Object.entries(data.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
      return; // keep the button locked while the browser leaves the page
    }
    window.location.href = data.url;
  };

  const applyCode = () => {
    const code = codeInput.trim().toUpperCase();
    setAppliedCode(code || undefined);
  };

  const shippingOptions = (Object.keys(DELIVERY_OPTIONS) as DeliveryMethod[]).map((method) => ({
    method,
    ...DELIVERY_OPTIONS[method],
    fee:
      method === "PARGO_PICKUP_POINT" ? settings.pargoPickupFee : method === "PARGO_COURIER_DOOR" ? settings.pargoDoorFee : settings.courierFee,
  }));

  const blocked = Boolean(quote?.issues.length);

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_420px]">
      <div className="space-y-12">
        {formError && (
          <div className="border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
            {formError}
          </div>
        )}

        {/* Contact */}
        <section>
          <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-500 text-sm text-gold-400">1</span>
            Contact
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="firstName">First name</label>
              <input id="firstName" className="input" autoComplete="given-name" value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} />
              {fieldError("customer.firstName")}
            </div>
            <div>
              <label className="label" htmlFor="lastName">Last name</label>
              <input id="lastName" className="input" autoComplete="family-name" value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} />
              {fieldError("customer.lastName")}
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" autoComplete="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
              {fieldError("customer.email")}
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile number</label>
              <input id="phone" type="tel" className="input" autoComplete="tel" placeholder="082 123 4567" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              {fieldError("customer.phone")}
            </div>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-zinc-400">
            <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="h-4 w-4 accent-gold-500" />
            Email me about new launches and private sales
          </label>
        </section>

        {/* Delivery */}
        <section>
          <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-500 text-sm text-gold-400">2</span>
            Delivery
          </h2>
          <div className="grid gap-3">
            {shippingOptions.map((opt) => (
              <label
                key={opt.method}
                className={cn(
                  "flex cursor-pointer items-start justify-between gap-4 border p-4 transition",
                  deliveryMethod === opt.method ? "border-gold-500 bg-gold-500/5" : "border-ink-500 hover:border-zinc-500",
                )}
              >
                <span className="flex gap-3">
                  <input
                    type="radio"
                    name="delivery"
                    className="mt-1 accent-gold-500"
                    checked={deliveryMethod === opt.method}
                    onChange={() => setDeliveryMethod(opt.method)}
                  />
                  <span>
                    <span className="block font-medium text-white">{opt.label}</span>
                    <span className="block text-sm text-zinc-400">{opt.description}</span>
                    <span className="mt-1 block text-xs text-zinc-500">{opt.eta}</span>
                  </span>
                </span>
                <span className="whitespace-nowrap text-sm text-gold-200">
                  {quote?.freeShipping ? "Free" : formatZAR(opt.fee)}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6">
            {deliveryMethod === "PARGO_PICKUP_POINT" ? (
              <PargoPickupSelector
                onSelectPoint={selectPoint}
                selectedPoint={pickupPoint}
                mapToken={settings.pargoMapToken}
                error={errors.pickupPoint}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="street">Street address</label>
                  <input id="street" className="input" autoComplete="street-address" placeholder="12 Jacaranda Ave, Unit 4" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
                  {fieldError("address.street")}
                </div>
                <div>
                  <label className="label" htmlFor="suburb">Suburb</label>
                  <input id="suburb" className="input" value={address.suburb} onChange={(e) => setAddress({ ...address, suburb: e.target.value })} />
                  {fieldError("address.suburb")}
                </div>
                <div>
                  <label className="label" htmlFor="city">City / Town</label>
                  <input id="city" className="input" autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  {fieldError("address.city")}
                </div>
                <div>
                  <label className="label" htmlFor="province">Province</label>
                  <select id="province" className="input" value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })}>
                    <option value="">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {fieldError("address.province")}
                </div>
                <div>
                  <label className="label" htmlFor="postalCode">Postal code</label>
                  <input id="postalCode" inputMode="numeric" maxLength={4} className="input" autoComplete="postal-code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value.replace(/\D/g, "") })} />
                  {fieldError("address.postalCode")}
                </div>
                {errors.address && <p className="field-error sm:col-span-2">{errors.address}</p>}
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="label" htmlFor="notes">Order notes (optional)</label>
            <textarea id="notes" rows={2} maxLength={500} className="input" placeholder="Gift message or delivery instructions" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>

        {/* Payment */}
        <section>
          <h2 className="mb-6 flex items-center gap-3 font-serif text-2xl text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold-500 text-sm text-gold-400">3</span>
            Payment
          </h2>
          {gateways.length === 0 ? (
            <p className="border border-ink-500 p-4 text-sm text-zinc-400">
              Online payments are being set up. Please contact us to complete your order.
            </p>
          ) : (
            <div className="grid gap-3">
              {gateways.map((g) => {
                const { title, text, Icon } = GATEWAY_INFO[g];
                return (
                  <label
                    key={g}
                    className={cn(
                      "flex cursor-pointer items-center gap-4 border p-4 transition",
                      gateway === g ? "border-gold-500 bg-gold-500/5" : "border-ink-500 hover:border-zinc-500",
                    )}
                  >
                    <input type="radio" name="gateway" className="accent-gold-500" checked={gateway === g} onChange={() => setGateway(g)} />
                    <Icon className="h-5 w-5 text-gold-400" strokeWidth={1.5} />
                    <span>
                      <span className="block font-medium text-white">{title}</span>
                      <span className="block text-sm text-zinc-400">{text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {fieldError("gateway")}
          <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" /> You&apos;ll be redirected to a secure page to pay. We never see or store your card details.
          </p>
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit space-y-6 border border-ink-500 bg-ink-800/60 p-7 lg:sticky lg:top-28">
        <h2 className="font-serif text-2xl text-white">Order Summary</h2>
        <ul className="scrollbar-thin max-h-72 space-y-4 overflow-y-auto pr-1">
          {(quote?.lines ?? []).map((line) => (
            <li key={line.variantId} className="flex items-center gap-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-ink-700">
                <ProductImage src={line.image} alt={line.productName} sizes="56px" />
                <span className="absolute -right-0 -top-0 flex h-5 min-w-5 items-center justify-center bg-gold-500 px-1 text-[10px] font-bold text-ink-900">
                  {line.quantity}
                </span>
              </div>
              <div className="flex-1 text-sm">
                <p className="text-white">{line.productName}</p>
                {line.variantLabel && <p className="text-xs text-zinc-500">{line.variantLabel}</p>}
              </div>
              <span className="text-sm text-zinc-200">{formatZAR(line.lineTotal)}</span>
            </li>
          ))}
          {!quote && <li className="h-16 animate-pulse bg-ink-700/60" />}
        </ul>

        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                className="input-sm pl-9 uppercase"
                placeholder="Discount code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCode();
                  }
                }}
                aria-label="Discount code"
              />
            </div>
            <button type="button" onClick={applyCode} className="border border-ink-500 px-4 text-xs uppercase tracking-wider text-zinc-300 hover:border-gold-500 hover:text-gold-300">
              Apply
            </button>
          </div>
          {quote?.discountMessage && <p className="mt-2 text-xs text-emerald-300">{quote.discountCode}: {quote.discountMessage}</p>}
          {appliedCode && quote?.discountError && <p className="field-error">{quote.discountError}</p>}
        </div>

        <dl className="space-y-3 border-t border-ink-500 pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Subtotal</dt>
            <dd className="text-zinc-200">{quote ? formatZAR(quote.subtotal) : "—"}</dd>
          </div>
          {quote && quote.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-zinc-400">Discount</dt>
              <dd className="text-emerald-300">−{formatZAR(quote.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-400">Delivery ({DELIVERY_OPTIONS[deliveryMethod].short})</dt>
            <dd className="text-zinc-200">{quote ? (quote.shipping === 0 ? "Free" : formatZAR(quote.shipping)) : "—"}</dd>
          </div>
          {quote && quote.amountToFreeShipping > 0 && (
            <p className="text-xs text-gold-500">Add {formatZAR(quote.amountToFreeShipping)} more for free delivery.</p>
          )}
          <div className="flex items-baseline justify-between border-t border-ink-500 pt-4">
            <dt className="uppercase tracking-[0.18em] text-zinc-300">Total</dt>
            <dd className="font-serif text-3xl text-white">
              {quoting && !quote ? <Loader2 className="h-5 w-5 animate-spin" /> : quote ? formatZAR(quote.total) : "—"}
            </dd>
          </div>
          <p className="text-right text-[11px] text-zinc-500">Prices in ZAR, VAT included where applicable</p>
        </dl>

        {quoteError && (
          <div className="flex items-start justify-between gap-3 border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200" role="alert">
            <span className="flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {quoteError}
            </span>
            <button type="button" onClick={() => setQuoteAttempt((n) => n + 1)} className="inline-flex shrink-0 items-center gap-1 font-semibold text-rose-100 underline-offset-2 hover:underline">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {quote?.issues.map((issue) => (
          <p key={issue} className="border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{issue}</p>
        ))}

        <button type="submit" disabled={submitting || !gateway || !quote || blocked || Boolean(quoteError) || quoting} aria-busy={submitting} className="btn-gold w-full py-4">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {submitting ? "Securing your order…" : gateway === "EFT" ? "Place order" : `Pay ${quote ? formatZAR(quote.total) : ""}`}
        </button>
        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          By placing your order you agree to our <Link href="/shipping" className="underline hover:text-gold-300">shipping &amp; returns policy</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-gold-300">privacy policy</Link>.
        </p>
      </aside>
    </form>
  );
}
