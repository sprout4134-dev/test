# chat-analyzer

실행 방법:

```bash
npx create-react-app chat-analyzer
cd chat-analyzer
npm start
```

> 이 저장소에는 `create-react-app` 결과와 동일한 기본 구조를 미리 반영해 두었습니다.
> 네트워크 정책으로 패키지 다운로드가 제한될 수 있으니, 가능한 환경에서 `npm install` 후 `npm start`를 실행하세요.


## 정적 테스트 페이지 (의존성 없이 실행)

의존성 설치 없이 UI 흐름을 빠르게 확인하려면 아래처럼 실행하세요.

```bash
cd chat-analyzer
python3 -m http.server 4173
```

브라우저에서 `http://localhost:4173/static-test.html` 접속 후 샘플 로그 또는 업로드 파일로 동작을 확인할 수 있습니다.
