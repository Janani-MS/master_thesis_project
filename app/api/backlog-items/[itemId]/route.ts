import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  deleteBacklogItem,
  getBacklogItemById,
  updateBacklogItem,
} from "@/lib/backlog/queries";
import { updateBacklogItemSchema } from "@/lib/backlog/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const existing = await getBacklogItemById(itemId);
  if (!existing) {
    return NextResponse.json(
      { error: "Backlog item not found." },
      { status: 404 },
    );
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
    const input = updateBacklogItemSchema.parse(body);

    if (Object.keys(input).length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update." },
        { status: 400 },
      );
    }

    const item = await updateBacklogItem(itemId, input);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input.", issues: error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Failed to update backlog item", error);
    return NextResponse.json(
      { error: "Failed to update backlog item." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const existing = await getBacklogItemById(itemId);
  if (!existing) {
    return NextResponse.json(
      { error: "Backlog item not found." },
      { status: 404 },
    );
  }

  await deleteBacklogItem(itemId);
  return NextResponse.json({ success: true });
}
