# Casa Tentudo — Site institucional, catálogo e painel administrativo

Site da **Casa Tentudo Materiais para Construção** (Assis/SP): página institucional, catálogo de produtos com consulta pelo WhatsApp e painel para a loja gerenciar o conteúdo sem programação.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 15 (App Router, Server Components), React 19, TypeScript |
| Estilo e animação | Tailwind CSS 3, Framer Motion (menu, avisos), IntersectionObserver (entradas na rolagem) |
| Backend | Route Handlers do Next.js (API REST em `/api`) |
| Banco de dados | MySQL 8+ ou MariaDB 10.6+ (`mysql2`, consultas parametrizadas) |
| Validação | Zod, no servidor, em todas as entradas |
| Autenticação | Sessão JWT (HS256, `jose`) em cookie `httpOnly` + `SameSite=Strict`; senhas com bcrypt (custo 12) |
| Imagens | Upload com `sharp`: valida o conteúdo real, remove metadados (EXIF/GPS), redimensiona e converte para WebP; `next/image` entrega AVIF/WebP com lazy loading |

## Estrutura

```
database/schema.sql          Esquema do banco (idempotente)
scripts/setup-db.mjs         Cria as tabelas e as categorias sugeridas
scripts/create-admin.mjs     Cria/redefine um administrador
src/middleware.ts            Barreira de acesso a /admin e /api/admin
src/app/(site)/              Páginas públicas: início, produtos, produto, categorias, sobre, contato
src/app/admin/               Painel: login, visão geral, produtos, categorias, avaliações, configurações, usuários, conta
src/app/api/                 API: auth, products, categories, testimonials, settings, uploads, users
src/app/media/[name]         Entrega das imagens enviadas pelo painel
src/app/sitemap.ts, robots.ts, opengraph-image.tsx, manifest.ts   SEO
src/lib/data/                Acesso ao banco (repositórios por entidade)
src/lib/                     Autenticação, validação, configurações, WhatsApp, logs, uploads
src/components/site/         Componentes do site público
src/components/admin/        Componentes do painel
```

## Como rodar

Requisitos: Node.js 20.12+ e um MySQL/MariaDB.

```bash
cd casa-tem-tudo
npm install
cp .env.example .env.local        # preencha banco, SESSION_SECRET e ADMIN_*
# no MySQL: CREATE DATABASE casatemtudo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
npm run db:setup                  # cria tabelas + categorias sugeridas
npm run admin:create              # cria o primeiro administrador (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                       # http://localhost:3000  ·  painel em /admin
```

Produção:

```bash
npm run build
npm start                         # use um proxy reverso (Nginx/Caddy) com HTTPS
```

Pontos de atenção na publicação:

- `SESSION_SECRET` com pelo menos 32 caracteres aleatórios; nunca o versione.
- `NEXT_PUBLIC_SITE_URL` com o domínio final (usado no sitemap, nos dados estruturados e no Open Graph).
- `UPLOAD_DIR` deve apontar para um diretório **persistente** e incluído no backup (as fotos enviadas ficam nele).
- Os logs de erro vão para o stdout e para `./logs/app-AAAA-MM-DD.log` (`LOG_DIR` altera o local).
- Faça backup periódico do banco (`mysqldump`) e do diretório de uploads.

## Painel administrativo (`/admin`)

- **Visão geral**: total de produtos e categorias, destaques, itens sem foto/categoria, últimos cadastros e histórico de alterações.
- **Produtos**: cadastrar, editar, excluir, ocultar, destacar, foto (arrastar e soltar), preço opcional (sem preço o site mostra “Consulte o preço”), marca, unidade, descrição e informações adicionais.
- **Categorias**: criar, editar, ícone ou imagem, ordem, ativar/desativar e excluir (os produtos continuam cadastrados, sem categoria).
- **Avaliações**: depoimentos reais exibidos na página inicial.
- **Configurações do site** (somente administradores): telefone, WhatsApp, e-mail, endereço, horários, redes sociais, textos institucionais, imagens/banners, nota e total de avaliações do Google, título e descrição para buscadores.
- **Usuários** (somente administradores): perfis *Administrador* e *Editor*.

Toda alteração atualiza o site na hora (cache invalidado por tags).

## WhatsApp

Todos os botões usam links oficiais `wa.me` com mensagem pronta:

- Geral: “Olá! Vim pelo site da Casa Tentudo e gostaria de falar com a equipe.”
- Produto: “Olá! Gostaria de saber mais sobre o produto [NOME DO PRODUTO].”
- Categoria e busca sem resultado: mensagens específicas.
- Página de contato: formulário que monta a mensagem e abre o WhatsApp (ou o e-mail), sem armazenar dados pessoais.

O número é editável no painel (padrão: +55 18 3321-1449).

## Segurança

- Rotas do painel protegidas no middleware **e** revalidadas no servidor a cada página/requisição (usuário ativo, perfil e versão da sessão).
- Troca de senha, desativação ou mudança de perfil revogam as sessões abertas.
- Limite de tentativas de login por IP e por e-mail (bloqueio de 15 minutos), com tempo de resposta constante.
- Verificação de `Origin` nas requisições que alteram dados (CSRF), além do cookie `SameSite=Strict`.
- Validação com Zod no servidor; SQL sempre parametrizado; busca com escape de curingas do `LIKE`.
- Upload: conteúdo real validado pelo `sharp`, limite de 8 MB, nome aleatório, entrega com regex estrita (sem *path traversal*).
- Cabeçalhos de segurança (HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`); painel com `noindex`.
- Nenhuma credencial é enviada ao navegador.

## SEO

Títulos e descrições por página, URLs amigáveis (`/produtos/nome-do-produto`), `sitemap.xml`, `robots.txt`, Open Graph com imagem gerada automaticamente, canônicas, breadcrumbs e dados estruturados Schema.org (`HardwareStore` com endereço, telefone e avaliação; `Product` e `BreadcrumbList` nas páginas de produto).

## O que a loja precisa fornecer

O site foi construído **sem inventar informações**. Para completá-lo:

1. **Fotos reais** da loja, fachada, equipe e produtos (até lá o site usa ilustrações próprias da marca).
2. **Horário de funcionamento** (Configurações → Horários).
3. **Link da página oficial no Facebook** (o padrão atual abre uma busca no Facebook).
4. **Avaliações reais** do Google para exibir como depoimentos (opcional).
5. **Revisão das categorias** sugeridas e **cadastro dos produtos** com preços, quando desejado.
6. **Domínio** e hospedagem com Node.js + MySQL.
