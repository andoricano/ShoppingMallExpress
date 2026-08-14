# GCP Cloud Run 배포 명령어 모음

## 1. GCP 프로젝트 확인 및 설정
gcloud config get-value project
gcloud config set project shopping-ex-server

## 2. Mac에서 GCP 서버용(amd64) Docker 이미지 빌드
docker build --platform linux/amd64 -t shopping-ex .

## 3. GCP Container Registry로 이미지 업로드
gcloud auth configure-docker
docker tag shopping-ex gcr.io/shopping-ex-server/shopping-ex:latest
docker push gcr.io/shopping-ex-server/shopping-ex:latest

## 4. Cloud Run 서비스 배포 (기존 서비스 대체)
gcloud run deploy shopping-ex \
  --image gcr.io/shopping-ex-server/shopping-ex:latest \
  --region asia-northeast3 \
  --platform managed \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars "SUPABASE_URL=YOUR_URL,SUPABASE_SECRET_KEY=YOUR_KEY,DATABASE_URL=YOUR_DB_URL"



ex
  gcloud run deploy shopping-ex \
  --image gcr.io/shopping-ex-server/shopping-ex:latest \
  --region asia-northeast3 \
  --platform managed \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars "SUPABASE_URL=[],SUPABASE_SECRET_KEY=[],DATABASE_URL=[]"
