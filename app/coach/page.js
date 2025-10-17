"use client";
import { useState } from "react";

export default function CoachPage() {
  const [newCard, setNewCard] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState("");

  const runCoach = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newCard, question })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoach(data.coach);
      } else {
        alert(data.error || "Coach failed");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">AI Spiritual Coach</h1>
      <div className="space-y-3 mb-4">
        <input className="w-full p-3 border rounded" placeholder="New card (optional)" value={newCard} onChange={e=>setNewCard(e.target.value)} />
        <input className="w-full p-3 border rounded" placeholder="Question (optional)" value={question} onChange={e=>setQuestion(e.target.value)} />
        <button disabled={loading} onClick={runCoach} className="px-4 py-2 rounded bg-purple-600 text-white">{loading?"Running...":"Run Coach"}</button>
      </div>
      {coach && (
        <div className="p-4 border rounded bg-white whitespace-pre-line">{coach}</div>
      )}
    </div>
  );
}


