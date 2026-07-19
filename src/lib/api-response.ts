import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

export function apiSuccess<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    { success: true, message, data, timestamp: new Date().toISOString() },
    { status },
  );
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, ...(error.status === 429 ? { error: error.message } : {}), message: error.message, errors: [], timestamp: new Date().toISOString() },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { success: false, message: "An unexpected error occurred", errors: [], timestamp: new Date().toISOString() },
    { status: 500 },
  );
}
