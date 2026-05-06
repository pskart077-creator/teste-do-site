export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      success: false,
      error: {
        code: "LOCAL_UPLOAD_DISABLED",
        message:
          "Upload local não está disponível em produção na Netlify. Configure um storage externo para enviar imagens.",
      },
    },
    { status: 501 },
  );
}