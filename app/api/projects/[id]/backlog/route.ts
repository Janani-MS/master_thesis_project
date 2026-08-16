import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProjectById } from "@/lib/projects/queries";
import {
  createBacklogItem,
  listBacklogItemsForProject,
} from "@/lib/backlog/queries";
import { createBacklogItemSchema } from "@/lib/backlog/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const items = await listBacklogItemsForProject(id);
  return NextResponse.json({ items });
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
    const input = createBacklogItemSchema.parse(body);
    const item = await createBacklogItem(id, input);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Failed to create backlog item", error);
    return NextResponse.json(
      { error: "Failed to create backlog item." },
      { status: 500 },
    );
  }
}
