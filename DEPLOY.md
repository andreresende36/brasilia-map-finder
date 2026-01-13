# Guia de Deploy - DFImóveis Mapper

Este guia explica como fazer deploy do projeto na internet. O projeto consiste em:
- **Frontend**: React + Vite (porta 8080)
- **Backend**: Express + Puppeteer (porta 3001)

## Opções de Deploy

### Opção 1: Railway (Recomendado) ⭐

Railway é excelente para projetos Node.js com Puppeteer.

#### Passos:

1. **Criar conta no Railway**
   - Acesse: https://railway.app
   - Faça login com GitHub

2. **Criar novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Conecte seu repositório

3. **Configurar variáveis de ambiente**
   - No dashboard do Railway, vá em "Variables"
   - Adicione: `PORT=3001` (Railway define automaticamente, mas pode ser útil)

4. **Configurar build**
   - Railway detecta automaticamente Node.js
   - O arquivo `railway.json` (criado abaixo) configura o build

5. **Deploy**
   - Railway faz deploy automático a cada push no GitHub
   - Ou clique em "Deploy" manualmente

**Custo**: Plano gratuito disponível, depois ~$5-20/mês dependendo do uso

---

### Opção 2: Render

Render também suporta Puppeteer bem.

#### Passos:

1. **Criar conta no Render**
   - Acesse: https://render.com
   - Faça login com GitHub

2. **Criar Web Service**
   - Clique em "New" → "Web Service"
   - Conecte seu repositório GitHub

3. **Configurações**:
   - **Name**: `brasilia-map-finder` (ou o que preferir)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Free (ou Starter para melhor performance)

4. **Variáveis de Ambiente**:
   - `NODE_ENV=production`
   - `PORT=3001` (Render define automaticamente)

**Custo**: Plano gratuito disponível, depois ~$7-25/mês

---

### Opção 3: Fly.io

Bom para apps que precisam de mais recursos (Puppeteer é pesado).

#### Passos:

1. **Instalar Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Criar app**
   ```bash
   fly launch
   ```

4. **Deploy**
   ```bash
   fly deploy
   ```

**Custo**: Plano gratuito disponível, depois ~$5-15/mês

---

## Preparação do Projeto

### 1. Arquivos de Configuração

Os arquivos abaixo já foram criados:
- `railway.json` - Configuração para Railway
- `render.yaml` - Configuração para Render
- `fly.toml` - Configuração para Fly.io (se necessário)
- `.env.example` - Exemplo de variáveis de ambiente

### 2. Scripts de Build

Adicione estes scripts no `package.json`:
- `build:server` - Compila o servidor TypeScript
- `start:prod` - Inicia o servidor em produção

### 3. Variáveis de Ambiente

Configure no serviço de deploy:
- `VITE_API_URL` - URL do servidor backend (ex: `https://seu-app.railway.app`)
- `PORT` - Porta do servidor (geralmente definida automaticamente)

---

## Estrutura de Deploy

### Opção A: Monorepo (Tudo em um serviço)

**Vantagem**: Mais simples, um único deploy
**Desvantagem**: Frontend e backend no mesmo processo

### Opção B: Separado (Recomendado)

**Frontend**: Vercel/Netlify (gratuito, otimizado para React)
**Backend**: Railway/Render (suporta Puppeteer)

**Vantagem**: Melhor performance, escalabilidade
**Desvantagem**: Dois deploys para gerenciar

---

## Notas Importantes

1. **Puppeteer é pesado**: O Chromium que o Puppeteer baixa tem ~300MB. Isso pode aumentar o tempo de build.

2. **Memória**: Puppeteer precisa de pelo menos 512MB de RAM. Plano gratuito pode não ser suficiente.

3. **Timeout**: Requisições de scraping podem demorar. Configure timeouts adequados no serviço.

4. **CORS**: O backend já está configurado com CORS para aceitar requisições do frontend.

---

## Próximos Passos

1. Escolha uma opção de deploy
2. Siga os passos específicos acima
3. Configure as variáveis de ambiente
4. Faça o deploy
5. Atualize `VITE_API_URL` no frontend para apontar para o backend deployado

