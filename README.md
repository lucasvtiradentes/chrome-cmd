# COMO PUBLICAR UMA NOVA VERSÃO?

- npx changeset
  - selecionar os pacotes que tiveram mudanca
  - definir o tipo de bump (major, minor, patch)
  - definir a mensage
- aprovar o MR gerado pelo github actions para poder publicar a nova versão

# COMO INSTALAR ALGUM PACOTE NUM PROJETO NODE?

- gerar um token no github contendo a permissão de `packages:read`
- criar o arquivo `.npmrc` com o seguinte conteúdo:

```bash
@lucasvtiradentes:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=TOKEN_DO_GITHUB
```

- instalar normalmente o pacote: `pnpm add @lucasvtiradentes/utils`

# LINKS ÚTEIS:

- PUBLICAR PACOTE

  - [Blazing Fast Tips: Publishing to NPM](https://www.youtube.com/watch?v=eh89VE3Mk5g)

- GITHUB PACKAGES

  - [Unauthorized when publishing private Package with Personal Access Token · community · Discussion #45097](https://github.com/orgs/community/discussions/45097)
  - [Working with the npm registry - GitHub Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
  - [A Guide to Publishing Private npm Package on GitHub](https://medium.com/@aamiralihussain53/a-guide-to-publishing-private-npm-package-on-github-9c533a251e2d)
  - [How can I publish a free-tier org package in a private repo to github packages? · community · Discussion #52077](https://github.com/orgs/community/discussions/52077)

- USAR PACOTE DO GITHUB REGISTRY

  - [Using auth tokens in .npmrc](https://stackoverflow.com/questions/53099434/using-auth-tokens-in-npmrc/61666885#61666885)

- UI

  - [How to Build a React Typescript NPM Package](https://www.hungrimind.com/articles/packaging-react-typescript)
  - [GitHub - vfshera/tsup-react-library-starter: React UI/Component library starter with tsup](https://github.com/vfshera/tsup-react-library-starter)
  - [Building and publishing NPM packages with typescript , multiple entry points, tailwind , tsup and npm](https://dev.to/tigawanna/building-and-publishing-npm-packages-with-typescript-multiple-entry-points-tailwind-tsup-and-npm-9e7)
  - [Publishing a React component library with Tailwind CSS](https://samrobbins.uk/blog/tailwind-component-library)
  - [Build a library with tsup and Tailwind | Spencer Miskoviak](https://www.skovy.dev/blog/build-component-libraries-with-tsup-tailwind?seed=s0qqv1)
  - [Building a Modern React Component Library: A Guide with Vite, TypeScript, and Tailwind CSS](https://medium.com/@mevlutcantuna/building-a-modern-react-component-library-a-guide-with-vite-typescript-and-tailwind-css-862558516b8d)
  - [Building Component Libraries with Tailwind and TSDX](https://www.youtube.com/watch?v=qi-do2A80hc)
