import { NextResponse } from "next/server";
import { getSprintContextById } from "@/lib/sprint-contexts/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  const { contextId } = await params;

  const sprintContext = await getSprintContextById(contextId);
  if (!sprintContext) {
    return NextResponse.json(
      { error: "Sprint context not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ sprintContext });
}
