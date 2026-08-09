### 내가 지금 어떤 GCP 프로젝트를 바라보고 있는지 헷갈릴 때
- gcloud config get-value project


### 1. 프로젝트 생성 및 지정
gcloud projects create name --name="name"
gcloud config set project name

### 2. Cloud Run 배포
- 일반 배포
gcloud run deploy name --source . --region asia-northeast3

- 저가 배포
gcloud run deploy shopping-ex --source . --region asia-northeast3 --max-instances 1

배포 시에 브라우저에서 GCP 결제 계정 관리 페이지에 프로젝트를 연결해야 함
https://console.cloud.google.com/billing/projects

- 환경변수 등록
gcloud run deploy shopping-ex --source . --region asia-northeast3 --max-instances 1 --set-env-vars "SUPABASE_URL=https://qwnloeffdnifwljnwshd.supabase.co,SUPABASE_SECRET_KEY=!!!!!!"

## 일반적은 워크플로우(아직 Docker X)
1. localhost로 express routing test 진행.
2. 그 다음 위 배포 명령어 진행