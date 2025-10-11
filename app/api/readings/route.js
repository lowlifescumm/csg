import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getUserReadings, getUserBirthCharts, getUserStats } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserStats(decoded.userId);
    const tarotReadings = await getUserReadings(decoded.userId);
    const birthCharts = await getUserBirthCharts(decoded.userId);

    return NextResponse.json({
      success: true,
      stats,
      readings: {
        tarot: tarotReadings,
        birthCharts: birthCharts
      }
    });
  } catch (error) {
    console.error("Error fetching user readings:", error);
    return NextResponse.json(
      { error: "Failed to fetch readings" },
      { status: 500 }
    );
  }
}
