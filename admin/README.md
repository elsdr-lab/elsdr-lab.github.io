# ELSDR 홈페이지 관리

관리자 화면: https://elsdr-lab.github.io/admin/

1. GitHub에서 연구실 조직에 접근할 수 있는 본인 계정을 사용합니다.
2. Fine-grained personal access token을 만듭니다. Resource owner는 `elsdr-lab`, 저장소는 `elsdr-lab.github.io`만 선택하고 Contents: Read and write를 허용합니다. 만료일을 정하세요. 조직 정책에 따라 Owner 승인이 필요합니다.
3. 관리자 화면에서 토큰을 입력합니다. 토큰은 페이지 메모리에서만 사용하고 파일·localStorage·sessionStorage·쿠키에 저장하지 않습니다. 닫거나 새로고침하면 다시 연결해야 합니다.
4. 원하는 메뉴에서 내용을 수정한 뒤 저장합니다. GitHub가 쓰기 권한을 확인하고 기록을 남깁니다. 공개 홈페이지 반영까지 몇 분이 걸릴 수 있습니다.

## 관리 범위

- 첫 화면 문구: home-records.js
- 구성원·저술: people-records.js
- 연구성과: research-records.js
- 행사·활동: life-records.js
- 연구자료: study-resources.js
- 연락처·모집: contact-records.js
- 사진: PNG/JPG/WebP, 4MB 이하. 업로드 후 항목도 저장하세요.

디자인과 ABOUT 상세 배치는 기존 코드에서 관리합니다. 이 화면은 공개 콘텐츠 편집용이며 비공개 개인정보를 저장하는 시스템이 아닙니다. 사이트와 저장소는 공개입니다. 데이터 파일의 변수명과 JSON 형식을 유지하세요.

## 충돌·복구

다른 관리자가 같은 자료를 수정한 경우 SHA 검사를 통해 덮어쓰기를 중단합니다. 입력 내용을 복사해 둔 후 다시 불러오세요. 저장은 main 브랜치의 GitHub commit으로 기록됩니다. 잘못 저장했을 때는 GitHub 변경 기록에서 이전 파일을 복구할 수 있습니다. 공개된 사이트가 바뀌기 전에 보이는 저장 성공은 저장소 반영 완료를 뜻하며, Pages 배포 성공을 보장하지 않습니다.

토큰 연결·실제 게시에는 유효한 관리자 자격이 필요합니다. 초기 설치 검증에서는 사용자의 토큰을 발급하거나 수집하지 않았습니다. 계정 인수인계 때 후임자가 본인 토큰을 발급하고 전임자 토큰·조직 권한은 회수하세요. 일반 GitHub 로그인만으로 쓰는 OAuth 방식은 별도 서버 및 앱 등록이 필요하며 이 버전에는 포함되지 않습니다.

공식 참고: https://docs.github.com/en/rest/repos/contents
