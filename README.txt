여행 일정 관리 앱 - GitHub → Cloudflare Pages Functions → D1 배포 안내

[프로젝트 구조]
index.html
functions/api/state.js
functions/api/health.js
schema.sql
README.txt

[저장 방식]
- index.html의 수정 내용은 /api/state를 통해 Cloudflare D1에 저장됩니다.
- D1 바인딩 이름은 반드시 DB로 설정합니다.
- 브라우저 localStorage는 서버 장애 시 임시 백업용으로만 사용합니다.
- 다른 기기에서 먼저 저장한 경우 버전 충돌을 감지하여 무심코 덮어쓰지 않습니다.

[1. GitHub 업로드]
1) 이 폴더 안의 파일과 functions 폴더를 구조 그대로 GitHub 저장소 최상위에 업로드합니다.
2) functions/api/state.js가 정확한 경로에 있어야 /api/state 주소가 생성됩니다.

[2. Cloudflare Pages 프로젝트 생성]
1) Cloudflare 대시보드 → Workers & Pages로 이동합니다.
2) Create application 또는 Create project → Pages → Connect to Git을 선택합니다.
3) 위 GitHub 저장소를 연결합니다.
4) Framework preset: None
5) Build command: 비워 둠
6) Build output directory: /
7) 저장하고 배포합니다.

[3. D1 데이터베이스 생성]
1) Cloudflare 대시보드 → Storage & Databases → D1 SQL Database로 이동합니다.
2) 새 D1 데이터베이스를 생성합니다. 예: trip-planner-db
3) 생성된 데이터베이스의 Console에서 schema.sql 내용을 전체 실행합니다.

[4. Pages 프로젝트에 D1 바인딩 연결]
1) Workers & Pages → 해당 Pages 프로젝트 → Settings → Bindings로 이동합니다.
2) Add binding → D1 database를 선택합니다.
3) Variable name: DB
4) D1 database: 방금 만든 데이터베이스 선택
5) Production과 Preview 환경 모두 사용할 경우 각각 DB 바인딩을 확인합니다.
6) 저장한 뒤 Pages 프로젝트를 다시 배포합니다.

[5. 연결 확인]
배포 주소 뒤에 아래 경로를 붙여 확인합니다.
- /api/health
  정상 예시: {"ok":true,"d1":true,...}
- /api/state
  최초 예시: {"ok":true,"state":null,"version":0,...}

그 다음 메인 주소로 접속하면 기본 춘천 일정이 D1에 최초 저장됩니다.
화면 상단 상태가 'D1 저장 완료' 또는 'D1 연결됨'으로 표시되면 정상입니다.

[업데이트 방법]
- 화면 디자인이나 프론트 기능만 수정: index.html 교체 후 GitHub에 커밋/푸시
- 저장 API 수정: functions/api/state.js도 함께 교체
- 데이터베이스 구조 변경: schema.sql 수정 후 D1 콘솔에서 마이그레이션 SQL 실행

[주의사항]
- GitHub Pages가 아니라 Cloudflare Pages에 연결해야 functions 폴더가 API로 동작합니다.
- DB 바인딩 이름은 대소문자를 포함해 정확히 DB여야 합니다.
- D1 데이터베이스 자체를 삭제하면 저장 일정도 삭제됩니다.
- 이 앱에는 로그인 기능이 없습니다. 배포 주소를 아는 사람은 일정을 읽고 수정할 수 있습니다.
  비공개 사용이 필요하면 이후 Cloudflare Access 또는 관리자 비밀번호 기능을 추가하세요.

[공식 문서]
- Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Static HTML on Pages: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- D1 prepared statements: https://developers.cloudflare.com/d1/worker-api/prepared-statements/
