# Anirom 🎬

Anirom é um aplicativo **Desktop** open source para catálogo e streaming, composto por um ecossistema robusto utilizando as melhores práticas de mercado (OWASP, Clean Architecture, etc).

## 🚀 Arquitetura
Este repositório contém APENAS o **Client (Desktop App)** da aplicação:
- Next.js encapsulado com Electron
- TypeScript
- Go-engine (para processamento de media local)

> **Nota:** Seguindo o modelo Open-Core, a infraestrutura de Backend (Microserviços, Banco de Dados, Mensageria) e o Painel Administrativo não fazem parte deste repositório e são mantidos de forma privada pelos mantenedores originais. O aplicativo conecta-se à API de produção na nuvem.

## ⚙️ Como rodar o projeto localmente

No diretório raiz (`frontend` / `app`), instale as dependências e rode a aplicação desktop:
```bash
# Configure o .env.local baseado no .env.example (Adicione a URL da API)
cp .env.example .env.local

# Instale as dependências
npm install

# Rode o aplicativo desktop (Electron)
npm run dev:electron
```

## 📜 Licença
Este projeto é licenciado sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Como Contribuir
- Respeite os padrões de código (Zero Hardcoding, Validações Rigorosas).
- Siga a tipagem estrita no TypeScript.
