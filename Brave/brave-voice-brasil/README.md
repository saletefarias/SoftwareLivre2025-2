# **Brave Voice Brasil**

### *Extensão minimalista de leitura em voz alta, desenvolvida para o Brave e inspirada no IFMA*

------------------------------------------------------------------------

##  **Descrição**

**Brave Voice Brasil** é uma extensão de leitura em voz alta focada em:

-   **Privacidade total**
-   **Simplicidade de uso**
-   **Experiência otimizada para o português do Brasil**

Criada como parte do projeto acadêmico do IFMA -- Sistemas de
Informação, a extensão utiliza apenas **recursos locais** do navegador e
do sistema operacional.\
Nenhum texto é enviado para servidores externos: toda síntese de voz
acontece via API nativa `chrome.tts`.
A extensão usa a API chrome.tts do navegador para acessar as vozes de síntese de fala disponíveis no sistema operacional, sem enviar texto para servidores externos.

O resultado é uma ferramenta leve, rápida e segura, ideal para:

-   estudantes\
-   pessoas com dificuldade de leitura\
-   usuários preocupados com privacidade\
-   leitura de trechos selecionados em páginas web

O ícone da extensão traz um design minimalista em verde, inspirado no verde da
identidade visual do IFMA, com ondas sonoras estilizadas como barras.

A extensão foi projetada para ser compatível com qualquer sistema operacional que suporte o Brave/Chromium e a API chrome.tts. Testes foram realizados em Windows 11 com voz pt-BR, e a compatibilidade em outras plataformas depende das vozes de síntese disponíveis localmente.

------------------------------------------------------------------------

##  **Diferenciais da Ferramenta**

### **1. 100% Offline e Privado**

-   Nenhum texto é transmitido externamente.\
-   A leitura é gerada localmente usando `chrome.tts`.\
-   Não há coleta, envio ou armazenamento de dados.

###  **2. Interface Minimalista**

-   Apenas botões essenciais: **Ler Seleção** e **Parar**\
-   Ajuste rápido de velocidade: **Lento, Normal, Rápido**\
-   Sem menus complicados, sem telas cheias, sem distrações.

### 🇧🇷 **3. Otimizada para o Português**

-   Voz padrão pt-BR automaticamente selecionada.\
-   Leitura fluida com velocidade calibrada para compreensão.

###  **4. Design Institucional e Simples**

-   Ícone verde circular inspirado no verde IFMA.\
-   Ondas sonoras minimalistas que remetem ao conceito de "voz".

###  **5. Focado em Produtividade**

-   Leitura imediata da seleção.\
-   Funcionamento consistente em qualquer página.\
-   Perfeito para leitura rápida de artigos, PDFs e conteúdos longos.

------------------------------------------------------------------------

##  **Como Usar**

###  1. **Instale a extensão manualmente**

1.  Abra o Brave.\
2.  Vá para:

```{=html}
<!-- -->
```
    brave://extensions

3.  Ative o **Modo Desenvolvedor**.\
4.  Clique em **Carregar sem compactação**.\
5.  Selecione a pasta:

```{=html}
<!-- -->
```
    brave-voice-brasil/

------------------------------------------------------------------------

###  2. **Use o botão da extensão**

1.  Selecione qualquer texto na página.\
2.  Clique no ícone da extensão.\
3.  Escolha a velocidade desejada.\
4.  Clique em **Ler Seleção**.

------------------------------------------------------------------------

###  3. **Use o menu de contexto**

1.  Selecione um texto.\
2.  Clique com o botão direito.\
3.  Selecione:

> **Ler seleção em voz alta (Brave Voice Brasil)**

------------------------------------------------------------------------

###  4. **Atalhos do teclado**

  Ação            Atalho
  --------------- ---------------------
  Ler seleção     **Alt + Shift + S**
  Parar leitura   **Alt + Shift + X**

------------------------------------------------------------------------

##  **Estrutura do Projeto**

    brave-voice-brasil/
    │
    ├── manifest.json
    ├── background.js
    ├── popup.html
    ├── popup.js
    └── icons/
         ├── icon16.png
         ├── icon48.png
         └── icon128.png

------------------------------------------------------------------------

##  **Tecnologias Utilizadas**

-   **Chrome/Brave Extensions -- Manifest V3**
-   **chrome.tts API** (síntese de voz local)
-   **chrome.contextMenus**
-   **chrome.scripting**
-   **HTML / CSS / JavaScript**

------------------------------------------------------------------------

##  **Possíveis Melhorias Futuras**

-   Modo "Leitura de Artigo" (limpeza de header/footer)\
-   Tema de acessibilidade com contraste ampliado\
-   Destaque visual do parágrafo sendo lido\
-   Modo "foco" para leitura sequencial\
-   Suporte a múltiplas vozes pt-BR\
-   Integração com PDFs via content script

------------------------------------------------------------------------

##  **Licença**

Este projeto é de código aberto e pode ser modificado para fins
educacionais.\
Recomenda-se manter os créditos ao IFMA -- Sistemas de Informação.
