import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProjectById } from "@/lib/projects/queries";
import { getBacklogItemById } from "@/lib/backlog/queries";
import {
  createDependency,
  findDependency,
  listDependenciesForProject,
} from "@/lib/dependencies/queries";
import { createDependencySchema } from "@/lib/dependencies/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const dependencies = await listDependenciesForProject(id);
  return NextResponse.json({ dependencies });
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
    const { fromItemId, toItemId } = createDependencySchema.parse(body);

    if (fromItemId === toItemId) {
      return NextResponse.json(
        { error: "An item cannot depend on itself." },
        { status: 400 },
      );
    }

    const [fromItem, toItem] = await Promise.all([
      getBacklogItemById(fromItemId),
      getBacklogItemById(toItemId),
    ]);

    if (!fromItem || !toItem) {
      return NextResponse.json(
        { error: "Both backlog items must exist." },
        { status: 400 },
      );
    }

    if (fromItem.projectId !== id || toItem.projectId !== id) {
      return NextResponse.json(
        { error: "Both backlog items must belong to this project." },
        { status: 400 },
      );
    }

    const existing = await findDependency(fromItemId, toItemId);
    if (existing) {
      return NextResponse.json(
        { error: "This dependency already exists." },
        { status: 409 },
      );
    }

    const dependency = await createDependency(fromItemId, toItemId);
    return NextResponse.json({ dependency }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Failed to create dependency", error);
    return NextResponse.json(
      { error: "Failed to create dependency." },
      { status: 500 },
    );
  }
}
