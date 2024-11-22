<p align="center">
  <a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/licenciamento/" target="blank"><img src="https://www.prefeitura.sp.gov.br/cidade/secretarias/upload/chamadas/URBANISMO_E_LICENCIAMENTO_HORIZONTAL_FUNDO_CLARO_1665756993.png" width="200" alt="SMUL Logo" /></a>
</p>

<p align="center">Teste técnico - SMUL/ATIC</p>

## Descrição

Repositório de teste técnico.
Documentação de tecnologia utilizada:

- NESTJS: https://docs.nestjs.com/
- PRISMAIO: https://www.prisma.io/docs/getting-started

## Instalação

```bash
$ npm install
```

## Rodando o aplicativo

```bash
# desenvolvimento
$ npm run start

# watch mode
$ npm run dev
```
## O Teste

A ideia é criar um sistema básico de controle de estoque, que execute algumas funções básicas:
  - /produto (get): 
    retorna uma lista de produtos ativos

  - /produto (post):
    adiciona um novo produto e retorna o mesmo

  - /produto/:id (get):
    retorna um produto buscando pelo id do mesmo, juntamente com os seus dados de operação, dentro do campo "operacoes"

  - /produto/:id (patch):
    atualiza um produto buscando pelo id do mesmo, retornando os dados do produto atualizado

  - /produto/:id (delete):
    desativa um produto, ou seja, atualiza o status do mesmo para false e retorna seus dados atualizados

  - /produto/:id/comprar
    realiza uma operação de compra do produto, atualizando o preço e quantidade, retornando os dados da operação, com os dados do produto da operação realizada

  - /produto/:id/vender
    realiza uma operação de venda do produto, atualizando a quantidade, retornando os dados da operação, com os dados do produto da operação realizada

As demais instruções sobre o teste estão em:

  /src/produto/produtos.service.ts