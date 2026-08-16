import { NextResponse } from "next/server";
import {
  deleteDependency,
  getDependencyById,
} from "@/lib/dependencies/queries";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ dependencyId: string }> },
) {
  const { dependencyId } = await params;

  const existing = await getDependencyById(dependencyId);
  if (!existing) {
    return NextResponse.json(
      { error: "Dependency not found." },
      { status: 404 },
    );
  }

  await deleteDependency(dependencyId);
  return NextResponse.json({ success: true });
}
