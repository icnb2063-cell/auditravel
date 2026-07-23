const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders
    }
  });
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return json({ ok: false, d1: false, error: "DB 바인딩이 없습니다." }, 500);
    }

    const result = await context.env.DB.prepare("SELECT 1 AS connected").first();
    return json({
      ok: true,
      d1: Number(result?.connected) === 1,
      message: "Cloudflare Pages Functions와 D1이 정상 연결되었습니다."
    });
  } catch (error) {
    console.error("GET /api/health", error);
    return json({ ok: false, d1: false, error: error.message || "D1 연결 확인 실패" }, 500);
  }
}
