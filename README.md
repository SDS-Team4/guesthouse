# guesthouse

게스트하우스

## 문서

- [SRS](SRS.md)
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [API Specification](API_SPEC.md)
- [OpenAPI Spec](openapi.yaml)
- [Requirements Baseline](requirements.txt)

문서 기준 메모:

- Guest Web/API와 Host/Admin Web/API는 원본 SRS 기준으로 분리 운영을 기본 원칙으로 합니다.
- 인증은 세션 기반이며 `JWT`는 사용하지 않습니다.
- 백엔드 구현 기본 정책에서 `Lombok`은 제외합니다.
- 비밀번호 찾기/재설정 기능은 `TBD-001` 확정 전까지 범위 보류입니다.
