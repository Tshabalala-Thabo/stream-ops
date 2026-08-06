# Phase 4 Cognito Guide

The first Phase 4 step adds Cognito infrastructure only. It does not enforce authentication in the app yet.

## What SAM Provisions

`infra/sam/template.yaml` creates:

- Cognito User Pool for StreamOps creators.
- Public web app User Pool Client with no client secret.
- Email-as-username sign-in model.
- Email auto-verification.
- Password policy for dev authentication practice.
- OAuth code-flow callback/logout URL configuration for local development.

Stack outputs:

```text
CognitoUserPoolId
CognitoUserPoolClientId
CognitoIssuer
CognitoDomain
```

## Training Focus

- User Pool: directory of users and JWT issuer.
- App Client: public application registration used by the web app.
- Client secret: disabled because browser-based apps cannot safely hold a secret.
- Hosted UI domain: Cognito-owned sign-in/logout URL used by the browser OAuth flow.
- JWT issuer: `https://cognito-idp.<region>.amazonaws.com/<userPoolId>`.
- Next steps: validate JWTs server-side, map Cognito `sub` to `ownerId`, and replace `LOCAL_OWNER_ID`.

## Deploy

Build and deploy the SAM update:

```bash
npm run sam:build
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name streamops-dev \
  --region af-south-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket streamops-dev-sam-artifacts-086769945536-af-south-1 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Expected outcome:

```text
Successfully created/updated stack - streamops-dev in af-south-1
```

Expected CloudFormation changes:

```text
AWS::Cognito::UserPool
AWS::Cognito::UserPoolClient
AWS::Cognito::UserPoolDomain
```

## Pull Env

After deploy:

```bash
npm run sam:env:pull
```

Expected output includes:

```text
COGNITO_USER_POOL_ID=<set>
COGNITO_CLIENT_ID=<set>
COGNITO_ISSUER=<set>
COGNITO_DOMAIN=<set>
```

Verify without printing values:

```bash
awk -F= '/^(COGNITO_USER_POOL_ID|COGNITO_CLIENT_ID|COGNITO_ISSUER|COGNITO_DOMAIN)=/ { print $1"=<set>" }' apps/web/.env.local
```

Expected outcome:

```text
COGNITO_USER_POOL_ID=<set>
COGNITO_CLIENT_ID=<set>
COGNITO_ISSUER=<set>
COGNITO_DOMAIN=<set>
```

## AWS Console Verification

Open:

```text
Amazon Cognito > User pools
```

Expected visible state:

- A user pool named `streamops-dev-creators`.
- An app client named `streamops-dev-web`.
- A Cognito domain named `streamops-dev-<account-id>`.
- Sign-in uses email.
- App client has no client secret.

## Completion Evidence

Mark `Add Cognito` complete only after:

- SAM deploy succeeds.
- Stack outputs include the Cognito user pool, client, issuer, and hosted domain outputs.
- `npm run sam:env:pull` adds the Cognito env vars locally.

Verified evidence:

```text
sam deploy
-> Created AWS::Cognito::UserPool
-> Created AWS::Cognito::UserPoolClient
-> Output CognitoUserPoolId=af-south-1_aDIw3sITV
-> Output CognitoUserPoolClientId=<set>
-> Output CognitoIssuer=https://cognito-idp.af-south-1.amazonaws.com/af-south-1_aDIw3sITV

npm run sam:env:pull
-> COGNITO_USER_POOL_ID=<set>
-> COGNITO_CLIENT_ID=<set>
-> COGNITO_ISSUER=<set>
```

AWS verification:

```text
User pool name: streamops-dev-creators
Username attributes: email
Auto-verified attributes: email
App client name: streamops-dev-web
App client secret: disabled for browser use
OAuth flow: code
Scopes: openid, email, profile
```

## Browser Sign-In Flow

The sign-in flow uses Cognito hosted UI with OAuth authorization code plus PKCE.

Code added:

```text
apps/web/app/api/auth/sign-in/route.ts
apps/web/app/auth/callback/route.ts
apps/web/app/api/auth/sign-out/route.ts
apps/web/lib/auth/oauth.ts
apps/web/components/app-shell/auth-actions.tsx
```

Important training focus:

- The browser redirects to Cognito instead of collecting passwords directly in this app.
- PKCE protects the authorization code flow for a public client with no client secret.
- Tokens are stored in HTTP-only cookies, not localStorage.
- The callback URL must exactly match the Cognito app client's allowed callback URL.

Expected local callback URL:

```text
http://localhost:3000/auth/callback
```

Expected local logout URL:

```text
http://localhost:3000
```

After deploying the hosted domain and pulling env, run:

```bash
npm run dev -w apps/web
```

Then open:

```text
http://localhost:3000
```

Expected outcome:

- Header shows a `Sign in` action.
- Clicking it redirects to the Cognito hosted UI.
- After successful sign-in, Cognito redirects back to `/auth/callback`.
- The callback exchanges the code for tokens and stores them in HTTP-only cookies.
- Header shows the signed-in email or username.

If Cognito reports a callback mismatch, confirm the app is running on port `3000` or update the SAM `CognitoCallbackUrls` parameter and redeploy.

## Server-Side JWT Validation

The reusable verifier lives at:

```text
apps/web/lib/auth/cognito.ts
```

The first validation endpoint is:

```text
GET /api/auth/session
```

It expects:

```text
Authorization: Bearer <cognito-jwt>
```

Important training focus:

- Cognito ID tokens use `aud` for the app client ID.
- Cognito access tokens use `client_id` for the app client ID.
- Both token types use the User Pool issuer URL.
- The app should never log or return raw JWTs.

### No Token Test

Run while the local web app is running:

```bash
curl -i http://localhost:3000/api/auth/session
```

Expected outcome:

```text
HTTP/1.1 401
```

Response body:

```json
{"authenticated":false,"code":"auth_token_required","message":"Authorization bearer token is required."}
```

### Valid Token Test

After signing in through Cognito and obtaining an ID or access token:

```bash
curl -i \
  -H "Authorization: Bearer $COGNITO_JWT" \
  http://localhost:3000/api/auth/session
```

Expected outcome:

```text
HTTP/1.1 200
```

Response body shape:

```json
{
  "authenticated": true,
  "ownerId": "<cognito-sub>",
  "subject": "<cognito-sub>",
  "email": "<email-or-null>",
  "username": "<username-or-null>",
  "tokenUse": "access"
}
```

or:

```json
"tokenUse": "id"
```

Completion evidence for `Validate JWTs server-side`:

- `npm run typecheck` passes.
- No-token request returns `401`.
- Valid Cognito token returns `200` with the Cognito `sub` as `ownerId`.

Current evidence:

```text
npm run typecheck
-> @streamops/web, @streamops/worker, @streamops/aws, and @streamops/core passed.

curl -i http://localhost:3010/api/auth/session
-> HTTP/1.1 401 Unauthorized
-> {"authenticated":false,"code":"auth_token_required","message":"Authorization bearer token is required."}

Sign-in flow code
-> OAuth sign-in, callback, sign-out, and header auth actions were added.
-> sam validate passed after adding AWS::Cognito::UserPoolDomain.

Browser session check
-> Signed in through Cognito hosted UI.
-> GET /api/auth/session returned authenticated JSON in the signed-in browser.
-> ownerId is provided by the Cognito sub claim.
```

`Validate JWTs server-side` is complete. The next Phase 4 checkpoint is to enforce this authenticated `ownerId` across workflow routes and remove hardcoded `LOCAL_OWNER_ID` usage from route handlers.

## Authenticated Owner Enforcement

Workflow routes now authenticate the request before reading or writing workflow data.

Code added or updated:

```text
apps/web/lib/workflow/http.ts
apps/web/app/api/workflow/uploads/route.ts
apps/web/app/api/workflow/uploads/[sessionId]/complete/route.ts
apps/web/app/api/workflow/uploads/[sessionId]/expire/route.ts
apps/web/app/api/workflow/videos/route.ts
apps/web/app/api/workflow/videos/[videoId]/route.ts
apps/web/app/api/workflow/videos/[videoId]/queue/route.ts
apps/web/app/api/workflow/videos/[videoId]/processing/start/route.ts
apps/web/app/api/workflow/videos/[videoId]/processing/succeed/route.ts
apps/web/app/api/workflow/videos/[videoId]/processing/fail/route.ts
apps/web/app/api/playback/[videoId]/hls/[...assetPath]/route.ts
apps/web/lib/workflow/store.ts
```

Important training focus:

- Authentication answers "who is this request from?"
- Authorization answers "is this user allowed to access this video/upload?"
- The route handler now passes Cognito `sub` as `ownerId`.
- The domain/store layer still validates ownership before returning records.
- Unauthenticated workflow API calls fail with `401`.

Completion evidence:

```text
grep -R "LOCAL_OWNER_ID" -n apps/web/app apps/web/lib
-> no route-handler usage remains.
-> only docs mentioned the old migration target before this update.

npm run typecheck
-> @streamops/web, @streamops/worker, @streamops/aws, and @streamops/core passed.

npm run build -w apps/web
-> Compiled successfully.
```

`Enforce owner checks from authenticated user identity` and `Replace hardcoded LOCAL_OWNER_ID` are complete for the web workflow routes.
