AUDITRAVEL - CLOUDFLARE WORKER + D1 배포 안내
=================================================

이 파일은 Cloudflare Pages용이 아니라 Cloudflare Worker 프로젝트용입니다.

[프로젝트 구조]

auditravel-worker/
├─ public/
│  └─ index.html
├─ src/
│  └─ index.js
├─ schema.sql
├─ wrangler.jsonc
├─ package.json
└─ README.txt


1. GitHub 업로드
----------------

압축을 풀고 위 파일과 폴더를 GitHub 저장소 최상위에 그대로 업로드합니다.

잘못된 예:
저장소/auditravel-worker/public/index.html

권장 예:
저장소/public/index.html
저장소/src/index.js
저장소/wrangler.jsonc


2. D1 데이터베이스 확인
-----------------------

Cloudflare 대시보드에서 D1 데이터베이스를 새로 만들거나 기존 데이터베이스를 사용합니다.

권장 데이터베이스 이름:
auditravel-db

D1 데이터베이스 상세 화면에서 Database ID를 복사합니다.


3. wrangler.jsonc 수정
----------------------

wrangler.jsonc에서 아래 부분을 찾습니다.

"database_id": "여기에_D1_DATABASE_ID를_입력하세요"

따옴표 안을 실제 D1 Database ID로 바꿉니다.

binding 값은 반드시 아래와 같아야 합니다.

"binding": "DB"


4. D1 스키마 실행
-----------------

방법 A. Cloudflare 대시보드

D1 → auditravel-db → Console에서 schema.sql 전체 내용을 실행합니다.

방법 B. 명령어

npm install
npm run d1:init


5. 기존 Worker 프로젝트에 GitHub 연결
-------------------------------------

Cloudflare → Workers & Pages → auditravel Worker → Settings 또는 Builds에서
GitHub 저장소를 연결합니다.

Build command:
npm install

Deploy command:
npm run deploy

Root directory:
/

Worker 이름은 wrangler.jsonc의 name 값인 auditravel로 설정되어 있습니다.


6. 정상 연결 확인
-----------------

배포 후 아래 주소를 엽니다.

https://auditravel.icnb2063.workers.dev/api/health

정상 예시:

{
  "ok": true,
  "d1": true,
  "message": "Cloudflare Worker와 D1이 정상 연결되었습니다."
}

메인 화면:

https://auditravel.icnb2063.workers.dev/


7. 저장 방식
------------

- 화면에서 수정하면 우선 현재 브라우저에 임시 보관됩니다.
- 페이지 맨 아래의 '수정사항 D1에 저장' 버튼을 눌러야 D1에 저장됩니다.
- D1 저장이 완료되면 다른 기기에서도 같은 내용을 볼 수 있습니다.
- 다른 기기에서 먼저 저장한 경우 충돌 확인창이 표시됩니다.
- 저장하지 않은 수정사항이 있으면 페이지를 닫을 때 경고가 표시됩니다.


8. API 경로
-----------

GET  /api/health
- Worker와 D1 연결 상태 확인

GET  /api/state
- 저장된 전체 여행 일정 조회

PUT  /api/state
- 전체 여행 일정 저장


9. 기존 Pages용 파일은 사용하지 않음
------------------------------------

다음 폴더는 Worker 프로젝트에서는 사용하지 않습니다.

functions/api/

이번 Worker용 프로젝트에서는 API 처리가 모두 아래 파일에 있습니다.

src/index.js


10. 자주 발생하는 오류
----------------------

/api/health가 404:
- src/index.js가 Worker 엔트리로 배포되지 않았거나
- wrangler.jsonc의 main 경로가 잘못되었거나
- 예전 Pages용 저장소가 배포된 상태입니다.

"D1 바인딩 DB가 설정되지 않았습니다":
- wrangler.jsonc의 database_id가 실제 ID가 아니거나
- binding 이름이 DB가 아닙니다.

메인 화면은 열리지만 API만 안 됨:
- assets.run_worker_first에 "/api/*"가 들어 있는지 확인합니다.
- 현재 제공 파일에는 이미 적용되어 있습니다.
