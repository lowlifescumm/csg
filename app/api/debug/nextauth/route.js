import { NextResponse } from 'next/server';
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";
import jwt from "jsonwebtoken";

// Same authOptions as the main route
const authOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code"
              }
            }
          })
        ]
      : []
    ),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  trustHost: true,
};

export async function GET() {
  try {
    const nextAuthResult = NextAuth(authOptions);
    
    const debugInfo = {
      type: typeof nextAuthResult,
      isNull: nextAuthResult === null,
      isUndefined: nextAuthResult === undefined,
      keys: nextAuthResult ? Object.keys(nextAuthResult) : [],
      hasHandlers: nextAuthResult?.handlers !== undefined,
      hasGET: nextAuthResult?.GET !== undefined,
      hasPOST: nextAuthResult?.POST !== undefined,
      isFunction: typeof nextAuthResult === 'function',
      handlersType: typeof nextAuthResult?.handlers,
      handlersKeys: nextAuthResult?.handlers ? Object.keys(nextAuthResult.handlers) : [],
      GETType: typeof nextAuthResult?.GET,
      POSTType: typeof nextAuthResult?.POST,
      // Try to stringify (might fail if circular)
      stringified: JSON.stringify(nextAuthResult, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        return value;
      }, 2),
    };

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      message: 'Check the debug object to see NextAuth handler structure'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

