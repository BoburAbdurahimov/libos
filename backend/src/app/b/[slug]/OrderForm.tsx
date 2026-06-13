"use client";

import { useState } from "react";

export default function OrderForm({ slug, productId }: { slug: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  if (state === "done") {
    return (
      <p style={{ color: "#15803d", fontWeight: 600, marginTop: 12 }}>
        ✓ Request sent — the seller will call you soon.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ marginTop: 12, width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#1c1917", color: "#fff", fontSize: 16, cursor: "pointer" }}
      >
        I want this
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const res = await fetch(`/api/b/${slug}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, buyerName: name, buyerPhone: phone }),
    });
    setState(res.ok ? "done" : "error");
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12, display: "grid", gap: 8 }}>
      <input
        required
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #d6d3d1", fontSize: 15 }}
      />
      <input
        required
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #d6d3d1", fontSize: 15 }}
      />
      <button
        disabled={state === "sending"}
        style={{ padding: 12, borderRadius: 10, border: "none", background: "#b45309", color: "#fff", fontSize: 16, cursor: "pointer" }}
      >
        {state === "sending" ? "Sending..." : "Send order request"}
      </button>
      {state === "error" && <span style={{ color: "#b91c1c" }}>Something went wrong, try again.</span>}
    </form>
  );
}
