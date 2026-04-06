# Instituto Amarte

## Supabase Auth

O frontend agora ja vem preparado para iniciar o login com Google via Supabase.

### Variaveis do frontend

Configure no Vercel do frontend:

```env
PUBLIC_SITE_URL=https://amarte-ten.vercel.app
PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
PUBLIC_API_BASE_URL=https://y-q3kr-delta.vercel.app/api
```

### URLs do Supabase Auth

No painel do Supabase:

1. `Authentication > URL Configuration`
2. `Site URL`: `https://amarte-ten.vercel.app`
3. `Redirect URLs`:
   - `http://localhost:4321/**`
   - `https://amarte-ten.vercel.app/auth/callback`
   - `https://*-naorespondaamarte-9716s-projects.vercel.app/**`

### Google Cloud

No Google Cloud Console:

1. Crie um `OAuth Client ID` do tipo Web.
2. Copie o callback mostrado no provider Google do Supabase.
3. Cole esse callback em `Authorized redirect URIs`.
4. Copie `Client ID` e `Client Secret`.

### Supabase Provider

No painel do Supabase:

1. `Authentication > Providers > Google`
2. Ative o provider.
3. Cole `Client ID` e `Client Secret`.

### Fluxo atual

- `/login` ja possui o botao `Entrar com Google`
- `/auth/callback` conclui o retorno do OAuth
- `/painel` reconhece a sessao do Supabase

### Proxima etapa recomendada

Migrar as rotas protegidas do backend para validar o usuario do Supabase, eliminando o login manual legado.
