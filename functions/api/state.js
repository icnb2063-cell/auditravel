const STATE_KEY = "main";
const MAX_STATE_BYTES = 900_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders
    }
  });
}

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

async function readCurrent(db) {
  const row = await db.prepare(`
    SELECT value, version, updated_at
    FROM app_state
    WHERE key = ?
  `).bind(STATE_KEY).first();

  if (!row) {
    return { state: null, version: 0, updated_at: null };
  }

  let state;
  try {
    state = JSON.parse(row.value);
  } catch (error) {
    throw new Error("D1에 저장된 JSON 데이터가 손상되었습니다.");
  }

  return {
    state,
    version: Number(row.version || 0),
    updated_at: row.updated_at || null
  };
}

function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return "state는 객체여야 합니다.";
  }

  if (!Array.isArray(state.trips)) {
    return "state.trips는 배열이어야 합니다.";
  }

  if (state.trips.length > 200) {
    return "저장할 수 있는 여행 수를 초과했습니다.";
  }

  for (const trip of state.trips) {
    if (!trip || typeof trip !== "object") return "여행 데이터 형식이 올바르지 않습니다.";
    if (!Array.isArray(trip.days)) return "여행 날짜 데이터 형식이 올바르지 않습니다.";
    if (trip.days.length > 366) return "한 여행에 저장할 수 있는 날짜 수를 초과했습니다.";
  }

  return null;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) {
      return json({ ok: false, error: "D1 바인딩 DB가 설정되지 않았습니다." }, 500);
    }

    await ensureSchema(context.env.DB);
    const current = await readCurrent(context.env.DB);

    return json({ ok: true, ...current });
  } catch (error) {
    console.error("GET /api/state", error);
    return json({ ok: false, error: error.message || "일정을 불러오지 못했습니다." }, 500);
  }
}

export async function onRequestPut(context) {
  try {
    if (!context.env.DB) {
      return json({ ok: false, error: "D1 바인딩 DB가 설정되지 않았습니다." }, 500);
    }

    await ensureSchema(context.env.DB);

    let body;
    try {
      body = await context.request.json();
    } catch (error) {
      return json({ ok: false, error: "요청 본문이 올바른 JSON이 아닙니다." }, 400);
    }

    const expectedVersion = Number(body.expected_version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return json({ ok: false, error: "expected_version이 올바르지 않습니다." }, 400);
    }

    const validationError = validateState(body.state);
    if (validationError) {
      return json({ ok: false, error: validationError }, 400);
    }

    const serialized = JSON.stringify(body.state);
    const byteLength = new TextEncoder().encode(serialized).byteLength;
    if (byteLength > MAX_STATE_BYTES) {
      return json({ ok: false, error: "저장 데이터가 너무 큽니다." }, 413);
    }

    // 한 개의 조건부 UPSERT로 오래된 화면의 덮어쓰기를 방지합니다.
    const result = await context.env.DB.prepare(`
      INSERT INTO app_state (key, value, version, updated_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        version = app_state.version + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE app_state.version = ?
    `).bind(STATE_KEY, serialized, expectedVersion).run();

    const changes = Number(result?.meta?.changes || 0);
    if (changes === 0) {
      const current = await readCurrent(context.env.DB);
      return json({
        ok: false,
        conflict: true,
        error: "다른 기기에서 먼저 수정되었습니다.",
        ...current
      }, 409);
    }

    const current = await readCurrent(context.env.DB);
    return json({ ok: true, ...current });
  } catch (error) {
    console.error("PUT /api/state", error);
    return json({ ok: false, error: error.message || "일정을 저장하지 못했습니다." }, 500);
  }
}
