import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProjectById } from "@/lib/projects/queries";
import {
  createSprintContext,
  listSprintContextsForProject,
} from "@/lib/sprint-contexts/queries";
import { createSprintContextSchema } from "@/lib/sprint-contexts/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const sprintContexts = await listSprintContextsForProject(id);
  return NextResponse.json({ sprintContexts });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    const input = createSprintContextSchema.parse(body);
    const sprintContext = await createSprintContext(id, input);
    return NextResponse.json({ sprintContext }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Failed to create sprint context", error);
    return NextResponse.json(
      { error: "Failed to create sprint context." },
      { status: 500 },
    );
  }
}
