import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview();

    // Listen for messages from the Webview (Chat UI)
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'onPrompt': {
          if (!data.value) return;

          const config = vscode.workspace.getConfiguration('alicnc.ai');
          const apiBase = config.get<string>('apiBase') || 'http://localhost:4000/v1';
          const apiKey = config.get<string>('apiKey') || '';
          const model = config.get<string>('model') || 'replicate/meta-llama-3-70b-instruct';

          if (!apiKey) {
            vscode.window.showErrorMessage('Ali CNC AI: No API Key provided in Settings.');
            webviewView.webview.postMessage({ type: 'onError', value: 'Please set your API Key in Settings.' });
            return;
          }

          try {
            // Forward the prompt to LiteLLM / Target Proxy
            const response = await fetch(`${apiBase}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: data.value }],
                stream: false
              })
            });

            const json = await response.json();
            const reply = json.choices?.[0]?.message?.content || "No response received.";
            
            webviewView.webview.postMessage({ type: 'onResponse', value: reply });

          } catch (err: any) {
            vscode.window.showErrorMessage(`Ali CNC AI API Error: ${err.message}`);
            webviewView.webview.postMessage({ type: 'onError', value: err.message });
          }
          break;
        }
      }
    });
  }

  private _getHtmlForWebview() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <style>
              body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-foreground); }
              #chat-container { display: flex; flex-direction: column; height: 95vh; }
              #messages { flex-grow: 1; overflow-y: auto; margin-bottom: 10px; }
              .msg { margin-bottom: 10px; padding: 8px; border-radius: 4px; }
              .user { background: var(--vscode-editor-inactiveSelectionBackground); }
              .ai { background: var(--vscode-editor-selectionBackground); border-left: 3px solid var(--vscode-activityBarBadge-background); }
              textarea { width: 100%; height: 60px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); resize: none; padding: 5px; margin-bottom: 5px; }
              button { width: 100%; padding: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; }
              button:hover { background: var(--vscode-button-hoverBackground); }
          </style>
      </head>
      <body>
          <div id="chat-container">
              <h3>Ali CNC Code AI</h3>
              <div id="messages"></div>
              <textarea id="prompt" placeholder="Ask anything about your code..."></textarea>
              <button id="sendBtn">Send via LiteLLM</button>
          </div>

          <script>
              const vscode = acquireVsCodeApi();
              const messagesDiv = document.getElementById('messages');
              const promptInput = document.getElementById('prompt');
              const sendBtn = document.getElementById('sendBtn');

              function appendMessage(role, text) {
                  const div = document.createElement('div');
                  div.className = 'msg ' + role;
                  div.textContent = text;
                  messagesDiv.appendChild(div);
                  messagesDiv.scrollTop = messagesDiv.scrollHeight;
              }

              sendBtn.addEventListener('click', () => {
                  const text = promptInput.value.trim();
                  if (!text) return;
                  appendMessage('user', text);
                  vscode.postMessage({ type: 'onPrompt', value: text });
                  promptInput.value = '';
                  appendMessage('ai', 'Thinking...');
              });

              window.addEventListener('message', event => {
                  const message = event.data;
                  if (message.type === 'onResponse') {
                      messagesDiv.lastChild.textContent = message.value;
                  } else if (message.type === 'onError') {
                      messagesDiv.lastChild.textContent = 'Error: ' + message.value;
                      messagesDiv.lastChild.style.color = 'var(--vscode-errorForeground)';
                  }
              });
          </script>
      </body>
      </html>
    `;
  }
}
