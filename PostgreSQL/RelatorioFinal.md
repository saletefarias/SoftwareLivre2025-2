# Contribuições ao Projeto PostgreSQL

- **Alunos:** JHONATHAN DA ROCHA DA CRUZ, KATERINY BISPO DE DEUS, SAULO FERRO MACIEL, Marcos Vinicius Cardoso Moreira Nascimento



Este repositório resume as contribuições técnicas, de documentação e de divulgação realizadas no contexto acadêmico, com foco no ecossistema PostgreSQL e em sua comunidade open source.

---

##  1. Contribuições Técnicas

### 1.1 Teste Automatizado de Regressão

Foi desenvolvido um **teste automatizado de regressão** para o PostgreSQL utilizando a suíte oficial baseada no **pg_regress**.  
O objetivo foi validar o comportamento de **funções de agregação SQL na presença de valores NULL**, prevenindo regressões futuras.

#### 🔍 Funcionalidades testadas
- `COUNT(coluna)` ignorando valores `NULL`
- Diferença entre `COUNT(coluna)` e `COUNT(*)`
- `AVG(coluna)` com valores `NULL`
- `AVG(coluna)` em tabelas vazias

####  Implementação
O teste segue o padrão da comunidade PostgreSQL:
- Arquivo `.sql` com os comandos de teste
- Arquivo `.out` com o resultado esperado
- Registro no arquivo `parallel_schedule` para execução paralela

####  Ambiente de Desenvolvimento
- WSL (Ubuntu)
- GCC, Make e dependências de compilação
- Repositório oficial do PostgreSQL
- Processo padrão: `configure` → `make`

####  Execução e Validação
O teste foi executado de forma isolada após a compilação.  
O `pg_regress` compara automaticamente a saída gerada com o arquivo esperado.

####  Relevância
- Aumenta a cobertura de testes
- Previne regressões
- Fortalece a confiabilidade do PostgreSQL
- Contribuição sem necessidade de alterar o core do sistema

####  Submissão
A contribuição foi enviada como **arquivo `.patch`** para a lista oficial **pgsql-hackers**, seguindo o fluxo de revisão da comunidade, e liberada pela moderação.

---

##  2. Contribuições de Documentação e Suporte

### 2.1 Replicação Lógica (`logical-replication.sgml`)
**Problemas identificados:**
- Explicações excessivamente conceituais
- Poucos exemplos práticos
- Falta de clareza no fluxo de configuração

**Melhoria proposta:**
- Nova seção com **exemplo completo e prático** de Replicação Lógica
- Demonstração clara do fluxo entre publisher e subscriber

---

### 2.2 Autovacuum (`maintenance.sgml`)
**Problemas identificados:**
- Abordagem muito teórica
- Pouca explicação sobre falhas ou atrasos do autovacuum

**Melhoria proposta:**
- Seção detalhando o **comportamento real do Autovacuum**
- Explicação sobre fatores que afetam sua execução:
  - Carga do sistema
  - Número de workers
  - Prioridade do processo

---

### 2.3 Freeze e Wraparound (`mvcc.sgml`)
**Problemas identificados:**
- Conceito pouco conectado à prática
- Falta de orientação operacional

**Melhoria proposta:**
- Relação direta entre **Freeze, Wraparound e Autovacuum**
- Inclusão de **alerta crítico operacional**

As melhorias foram enviadas à comunidade via **patch de documentação**.

---

##  3. Contribuições Criativas e Divulgação

Com foco na **popularização do PostgreSQL**, foi realizada uma análise de fóruns e redes sociais, identificando como principal problema a **dificuldade de introdução acessível ao SGBD**.

###  Solução Proposta
Criação de um **jogo educacional** utilizando gamificação como forma de ensino introdutório.

- Nome do projeto: **Game Slide**
- Estilo: jogo de plataforma
- Objetivo: ensinar conceitos básicos do PostgreSQL de forma lúdica
- Público-alvo: iniciantes de todas as idades

###  Divulgação
- Compartilhado em fóruns e no YouTube
- Disponibilizado via **GitHub Pages**
- Licença **MIT**
- Link do protótipo: https://rebrand.ly/qsduw7w

###  Impacto
- Feedbacks positivos e construtivos da comunidade
- Destaque em fóruns como:
  - TabNews (2º lugar)
  - Dio e Diolinux (mais de 100 visualizações)
- Sugestões para transformar o projeto em um serviço educacional

---

##  Conclusão

As contribuições abrangeram:
- **Qualidade técnica** (testes automatizados)
- **Clareza documental** (melhorias na documentação oficial)
- **Inovação na divulgação** (gamificação)

Essas ações reforçam o compromisso com o software livre, a comunidade PostgreSQL e a democratização do conhecimento técnico.

---
