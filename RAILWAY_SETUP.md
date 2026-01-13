# Guia Completo de Deploy no Railway 🚂

Este guia vai te ajudar a fazer deploy do DFImóveis Mapper no Railway passo a passo.

## Pré-requisitos

1. Conta no GitHub (se ainda não tiver, crie em https://github.com)
2. Repositório do projeto no GitHub (push do código)

## Passo 1: Preparar o Repositório GitHub

Se ainda não fez push do código:

```bash
# No terminal, na pasta do projeto:
git init
git add .
git commit -m "Initial commit - DFImóveis Mapper"
git branch -M main
git remote add origin <URL_DO_SEU_REPOSITORIO>
git push -u origin main
```

## Passo 2: Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Start a New Project"** ou **"Login"**
3. Faça login com sua conta GitHub
4. Autorize o Railway a acessar seus repositórios

## Passo 3: Criar Novo Projeto

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Escolha o repositório `brasilia-map-finder` (ou o nome que você deu)
4. O Railway vai começar a detectar o projeto automaticamente

## Passo 4: Configurar Variáveis de Ambiente

1. No projeto criado, clique em **"Variables"** (ou na aba "Variables")
2. Adicione as seguintes variáveis:

   ```
   NODE_ENV=production
   PORT=3001
   ```

   **Nota**: O Railway geralmente define `PORT` automaticamente, mas é bom deixar explícito.

3. **IMPORTANTE**: Após o deploy, você precisará adicionar:
   ```
   VITE_API_URL=https://seu-app.railway.app
   ```
   Mas isso só será necessário se você fizer deploy separado do frontend.

## Passo 5: Configurar Build e Deploy

O Railway vai detectar automaticamente que é um projeto Node.js. Ele vai:

1. Executar `npm install`
2. Executar o build (conforme `railway.json`)
3. Iniciar o servidor

### Verificar Configuração

O arquivo `railway.json` já está configurado:
- **Build Command**: `npm install && npm run build && npm run build:server`
- **Start Command**: `npm run start:prod`

## Passo 6: Acompanhar o Deploy

1. No dashboard do Railway, você verá os logs do build
2. O build pode demorar 5-10 minutos na primeira vez (Puppeteer baixa Chromium)
3. Aguarde até ver: `🚀 Servidor de scraping rodando em http://localhost:3001`

## Passo 7: Obter a URL do Deploy

1. Após o deploy concluir, clique em **"Settings"**
2. Role até **"Domains"**
3. Clique em **"Generate Domain"** (ou use o domínio automático)
4. Você terá uma URL como: `https://brasilia-map-finder-production.up.railway.app`

## Passo 8: Configurar Frontend (Se necessário)

Se você quiser fazer deploy separado do frontend:

1. **Opção A**: Usar o mesmo serviço (já configurado)
   - O servidor já serve o frontend em produção
   - Acesse a URL do Railway e tudo deve funcionar

2. **Opção B**: Deploy separado no Vercel/Netlify
   - Faça deploy do frontend no Vercel
   - Configure `VITE_API_URL` no Vercel apontando para a URL do Railway

## Passo 9: Testar

1. Acesse a URL do Railway
2. Cole uma URL do DFImóveis
3. Teste se o scraping funciona

## Troubleshooting

### Erro: "Build failed"
- Verifique os logs no Railway
- Certifique-se de que `package.json` tem todos os scripts necessários
- Verifique se o TypeScript compila: `npm run build:server`

### Erro: "Port already in use"
- O Railway define `PORT` automaticamente
- Não precisa configurar manualmente

### Erro: "Puppeteer not found"
- O build pode demorar - Puppeteer baixa Chromium (~300MB)
- Aguarde o build completar

### Erro: "Memory limit exceeded"
- Plano gratuito tem limite de memória
- Considere upgrade para plano pago ou use Render/Fly.io

### Frontend não carrega
- Verifique se `npm run build` foi executado
- Verifique se o servidor está servindo arquivos estáticos
- Veja os logs do Railway

## Monitoramento

No Railway você pode:
- Ver logs em tempo real
- Ver métricas de CPU/Memória
- Configurar alertas
- Ver histórico de deploys

## Atualizações Futuras

Após configurar, cada `git push` para o repositório vai:
1. Triggerar um novo deploy automaticamente
2. Buildar o projeto
3. Fazer deploy da nova versão

## Custos

- **Plano Gratuito**: $5 de crédito/mês (suficiente para testes)
- **Plano Hobby**: $5/mês (recomendado para produção)
- **Plano Pro**: $20/mês (para uso intenso)

## Próximos Passos

1. ✅ Fazer push do código para GitHub
2. ✅ Criar projeto no Railway
3. ✅ Configurar variáveis de ambiente
4. ✅ Fazer primeiro deploy
5. ✅ Testar a aplicação
6. ✅ Compartilhar a URL!

---

**Dúvidas?** Consulte os logs do Railway ou a documentação: https://docs.railway.app

