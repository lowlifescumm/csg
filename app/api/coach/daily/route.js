import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getPinecone } from "@/lib/pinecone";
import { pool } from "@/lib/db";
import { createEmbedding, generateCoachReply } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = decoded.userId;

    // Ensure subscription active
    const { rows: subRows } = await pool.query(
      "SELECT status FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const active = ["active", "trialing", "past_due"].includes(subRows[0]?.status);
    if (!active) return NextResponse.json({ error: "Subscription required for AI Coach" }, { status: 402 });

    const { newCard, question = "" } = await request.json();
    const queryText = `Daily check-in for user ${userId}. New card: ${newCard || "(not provided)"}. Question: ${question || "(none)"}`;
    const qEmb = await createEmbedding(queryText);

    // Query Pinecone topK=3 filtered by user_id
    const pine = getPinecone();
    const index = pine.index(process.env.PINECONE_INDEX || 'csg-tarot');
    const res = await index.query({
      vector: qEmb,
      topK: 3,
      filter: { user_id: { $eq: userId } }
    });

    const ids = (res.matches || []).map(m => m.id);
    let pastSummaries = [];
    if (ids.length) {
      const { rows } = await pool.query(
        `SELECT id, created_at, summary
         FROM readings WHERE id = ANY($1::int[]) AND user_id=$2 ORDER BY created_at DESC`,
        [ids.map(id => parseInt(id, 10)).filter(n => !isNaN(n)), userId]
      );
      pastSummaries = rows.map(r => `(${new Date(r.created_at).toISOString().slice(0,10)}) ${r.summary || ""}`);
    }

    const coach = await generateCoachReply({ pastSummaries, newCard, question });
    return NextResponse.json({ success: true, coach });
  } catch (err) {
    console.error('Coach daily error:', err);
    return NextResponse.json({ error: "Failed to run coach" }, { status: 500 });
  }
}


