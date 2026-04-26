import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: { message } }, { status });
}
