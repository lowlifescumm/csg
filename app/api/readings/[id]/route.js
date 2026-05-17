import { NextResponse } from "next/server";
import { getReadingById } from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const reading = await getReadingById(id);

    if (!reading) {
      return NextResponse.json({ error: "Reading not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reading: {
        id: reading.id,
        type: reading.type,
        question: reading.question,
        result: reading.result,
        createdAt: reading.created_at,
      },
    });
  } catch (error) {
    logger.error("Error fetching reading:", error);
    return NextResponse.json({ error: "Failed to fetch reading" }, { status: 500 });
  }
}