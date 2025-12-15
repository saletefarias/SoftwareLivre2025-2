// Brave Voice Brasil - background.js

const DEFAULT_RATE = 1.0;
let currentRate = DEFAULT_RATE;

// Cria o item no menu de contexto ao instalar/atualizar a extensão
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "brave-voice-brasil-read-selection",
    title: "Ler seleção em voz alta (Brave Voice Brasil)",
    contexts: ["selection"]
  });
});

// Handler do menu de contexto (clique com botão direito em texto selecionado)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (
    info.menuItemId === "brave-voice-brasil-read-selection" &&
    info.selectionText
  ) {
    speakText(info.selectionText);
  }
});

// Fala o texto usando chrome.tts, só com recursos locais
function speakText(text) {
  if (!text || !text.trim()) {
    return;
  }

  // Para qualquer leitura em andamento antes de iniciar outra
  chrome.tts.stop();

  chrome.tts.speak(text, {
    lang: "pt-BR",
    rate: currentRate,
    pitch: 1.0,
    enqueue: false,
    onEvent: (event) => {
      if (event.type === "error") {
        console.error("Erro na síntese de voz:", event.errorMessage);
      }
    }
  });
}

// Recebe mensagens do popup (para ler texto / parar / mudar velocidade)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "SPEAK_TEXT") {
    const text = message.text || "";
    const rate = typeof message.rate === "number" ? message.rate : DEFAULT_RATE;
    currentRate = rate;
    speakText(text);
    sendResponse({ ok: true });
    return true;
  }

  if (message && message.type === "STOP_READING") {
    chrome.tts.stop();
    sendResponse({ ok: true });
    return true;
  }
});

// Atalhos de teclado definidos em "commands" no manifest
chrome.commands.onCommand.addListener((command) => {
  if (command === "stop-reading") {
    chrome.tts.stop();
    return;
  }

  if (command === "read-selection") {
    // Lê a seleção da aba ativa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const tabId = tabs[0].id;

      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => window.getSelection().toString()
        },
        (results) => {
          if (
            chrome.runtime.lastError ||
            !results ||
            !results.length ||
            !results[0].result
          ) {
            console.warn("Nenhum texto selecionado para ler.");
            return;
          }

          const selectedText = results[0].result;
          speakText(selectedText);
        }
      );
    });
  }
});
