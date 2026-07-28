import { handlePublicActLivesRequest } from "@/lib/api/publicLives";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handlePublicActLivesRequest(request, slug);
}
