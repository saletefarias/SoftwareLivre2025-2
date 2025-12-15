// Brave Voice Brasil - popup.js

function getSelectedRate() {
  const radios = document.querySelectorAll('input[name="speed"]');
  for (const r of radios) {
    if (r.checked) {
      const value = parseFloat(r.value);
      if (!isNaN(value)) {
        return value;
      }
    }
  }
  return 1.0;
}

// Clicar em "Ler seleção"
document.getElementById("btn-read-selection").addEventListener("click", () => {
  const rate = getSelectedRate();

  // Pega a aba ativa
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs.length) {
      alert("Não foi possível encontrar a aba ativa.");
      return;
    }

    const tabId = tabs[0].id;

    // Executa na página para pegar o texto selecionado
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => window.getSelection().toString()
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          alert("Erro ao acessar a seleção de texto.");
          return;
        }

        if (!results || !results.length || !results[0].result) {
          alert("Nenhum texto selecionado na página.");
          return;
        }

        const selectedText = results[0].result;

        chrome.runtime.sendMessage(
          {
            type: "SPEAK_TEXT",
            text: selectedText,
            rate
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
            }
            // não precisamos fazer nada especial com a resposta
          }
        );
      }
    );
  });
});

// Clicar em "Parar leitura"
document.getElementById("btn-stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP_READING" }, () => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    }
  });
});
