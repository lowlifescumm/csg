// /app/api/free-tarot/claim/route.js
import { NextResponse } from "next/server";
import { claimFreeReading } from "@/lib/free-reading.js";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { getAuthenticatedUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { readingId } = await request.json();
    
    if (!readingId) {
      return NextResponse.json({ error: "Reading ID is required" }, { status: 400 });
    }
    
    // Get authenticated user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { userId } = authResult;
    
    // Claim the reading
    const result = await claimFreeReading(readingId, userId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      reading: result.reading,
      message: "Your free reading has been saved to your account!"
    });
  } catch (err) {
    console.error("Claim reading error:", err);
    return NextResponse.json({ error: "Failed to claim reading" }, { status: 500 });
  }
}
