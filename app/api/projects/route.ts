import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProject, listProjects } from "@/lib/projects/queries";
import { createProjectSchema } from "@/lib/projects/validation";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
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
    const input = createProjectSchema.parse(body);
    const project = await createProject(input);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Failed to create project", error);
    return NextResponse.json(
      { error: "Failed to create project." },
      { status: 500 },
    );
  }
}
