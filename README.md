# MALL

## Development

### API

```bash
pnpm --filter @mall/api dev
```

```bash
docker run --name mall-api-container \
  -p 8080:8080 \
  --env-file apps/api/.env \
  mall-api
```

### Admin

```bash
pnpm --filter @mall/user-web dev
```

### Client

```bash
pnpm --filter @mall/client-web dev
```

## Deployment

MVP 배포는 `deployment-mvp-mall` 브랜치를 기준으로 진행합니다.

```bash
git push origin deployment-mvp-mall
```

`deployment-mvp-mall` 브랜치에 Push하면 배포 환경에서 해당 브랜치의 코드를 기준으로 서비스가 업데이트됩니다.

* Client Web → Netlify
* Admin Web → Netlify
* API → Google Cloud
