<div align="center">

<!-- Substitua o link do src pela URL da sua logo no futuro -->
<img src="./frontend/public/images/anirom-logo.png" width="144" alt="Anirom Logo" />

<h1 align="center">Anirom</h1>

<p align="center">
  <strong>Anirom é um aplicativo Desktop de código aberto criado para ser a sua central definitiva de catálogo e streaming de animes. O Anirom é escrito em Typescript,  Go e Java.</strong>
</p>

<!-- Você pode configurar essas badges depois que criar seu repositório no Github e adicionar actions/releases -->
[![build](https://img.shields.io/github/actions/workflow/status/SeuUsuario/anirom/build.yml)](https://github.com/SeuUsuario/anirom/actions)
[![release](https://img.shields.io/github/v/release/SeuUsuario/anirom)](https://github.com/SeuUsuario/anirom/releases)
[![license](https://img.shields.io/github/license/SeuUsuario/anirom)](https://github.com/SeuUsuario/anirom/blob/main/LICENSE)


<img src="./frontend/public/images/anirom-interface.png" width="1200" alt="Anirom interface" />

</div>

## 🌟 Funcionalidades

- **Catálogo Completo:** Navegue, busque e descubra seus animes favoritos com metadados detalhados.
- **Motor Integrado:** Assista diretamente no app usando o motor de streaming nativo ultra rápido escrito em Go.
- **Ecossistema Fechado:** Conectado à nossa infraestrutura otimizada para a melhor velocidade e segurança.
- **Design Moderno:** Interface de usuário clean e imersiva construída com TailwindCSS e shadcn/ui.

## 🛠️ Tecnologias

- **Desktop (BFF):** [Electron](https://www.electronjs.org/), [Node.js](https://nodejs.org/), [tRPC](https://trpc.io/), [TypeScript](https://www.typescriptlang.org/)
- **Interface:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Motor:** [Go](https://go.dev/)
- **Player:** [MPV](https://mpv.io/)
- **Backend (Nuvem):** [Spring Boot](https://spring.io/), [Java](https://www.java.com/), [PostgreSQL](https://www.postgresql.org/)

## ⚙️ Como executar localmente

Siga os passos abaixo para instalar as dependências e rodar o aplicativo na sua máquina:

```bash
# 1. Clone o repositório
git clone https://github.com/SeuUsuario/anirom-app/anirom.git
cd anirom

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# (Edite o .env.local com os endpoints da API oficial ou de dev)

# 3. Instale as dependências
npm install

# 4. Rode a versão Desktop (Electron)
npm run dev
```

## 🤝 Como Contribuir

Toda ajuda é bem-vinda! Se quiser contribuir para o cliente desktop do Anirom:
1. Respeite os padrões de código, em especial o uso estrito de tipagem no TypeScript.
2. Faça um Fork do projeto e crie uma branch com a sua feature.
3. Envie um Pull Request!

## 📜 Licença

O cliente Anirom (este repositório) é licenciado sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. A infraestrutura de backend e serviços conectados possuem licenças e restrições próprias.
