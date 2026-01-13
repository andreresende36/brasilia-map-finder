# Configuração do Servidor de Scraping Local

## Problema Resolvido

O scraping direto do navegador estava sendo bloqueado por políticas CORS (Cross-Origin Resource Sharing). A solução foi criar um servidor Node.js local que faz o scraping no servidor, evitando problemas de CORS.

## Como Usar

### Opção 1: Rodar servidor e frontend separadamente

1. **Inicie o servidor de scraping** (em um terminal):
```bash
npm run server
```

O servidor irá rodar em `http://localhost:3001`

2. **Inicie o frontend** (em outro terminal):
```bash
npm run dev
```

### Opção 2: Rodar ambos simultaneamente (Recomendado)

```bash
npm run dev:all
```

Isso iniciará tanto o servidor quanto o frontend ao mesmo tempo.

## Estrutura

- **Servidor**: `server/index.ts` - Servidor Express que faz o scraping usando cheerio
- **API Client**: `src/lib/api.ts` - Cliente que faz requisições para o servidor local
- **Frontend**: Continua usando `src/lib/api.ts` normalmente

## Variáveis de Ambiente (Opcional)

Você pode configurar a URL do servidor através de uma variável de ambiente:

Crie um arquivo `.env` na raiz do projeto:
```
VITE_API_URL=http://localhost:3001
```

Por padrão, o código usa `http://localhost:3001` se a variável não estiver definida.

## Notas

- O servidor precisa estar rodando para que o scraping funcione
- O servidor usa a porta 3001 por padrão
- O frontend usa a porta 8080 por padrão
- O servidor usa `cheerio` que funciona perfeitamente no Node.js

