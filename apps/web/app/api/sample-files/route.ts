import { NextResponse } from "next/server";
import { SAMPLE_REACTIVE_RESUME_FILES } from "../../../lib/sample-files";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: "reactive-resume",
    files: SAMPLE_REACTIVE_RESUME_FILES,
  });
}

