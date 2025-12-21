import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUserReadings, getUserBirthCharts, getUserStats } from "@/lib/db";
import { cookies } from "next/headers";
import { authOptions } from '@/lib/auth-config';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const auth = await getAuthenticatedUser(cookieStore, authOptions);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserStats(auth.userId);
    const tarotReadings = await getUserReadings(auth.userId);
    const birthCharts = await getUserBirthCharts(auth.userId);

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
