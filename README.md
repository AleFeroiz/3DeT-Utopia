# ⚓ 3DeT One Piece — Sistema de Fichas

Sistema de criação e gerenciamento de fichas para o sistema 3DeT One Piece.

## 🚀 Hospedagem no GitHub Pages (grátis)

1. Crie um repositório no GitHub
2. Envie todos os arquivos para o repositório
3. Vá em **Settings → Pages → Source → Deploy from branch → main → / (root)**
4. Aguarde alguns minutos — seu site estará em `https://SEU_USUARIO.github.io/NOME_DO_REPO`

---

## 🔑 Configurar Login Google (Firebase)

1. Acesse [https://console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative **Authentication → Sign-in method → Google**
4. Ative **Firestore Database** (modo de produção)
5. Vá em **Project Settings → Seus apps → Web** → registre um novo app
6. Copie o objeto `firebaseConfig` e cole em `js/firebase.js` substituindo os valores `"COLE_AQUI"`
7. No **Firestore → Rules**, configure:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

8. Em **Authentication → Settings → Authorized domains**, adicione o seu domínio do GitHub Pages

---

## 📁 Estrutura do projeto

```
rpg/
├── index.html              ← Lista de fichas
├── ficha.html              ← Editor de ficha
├── style/
│   ├── global.css
│   ├── ficha.css
│   └── toast.css
└── js/
    ├── app.js              ← Ponto de entrada
    ├── firebase.js         ← Auth + Firestore
    ├── storage.js          ← localStorage
    ├── dados/
    │   ├── banco.js
    │   ├── bancoCaracteristicas.js
    │   ├── niveis.js       ← Tabela de progressão
    │   ├── racas.js        ← Todas as raças
    │   └── profissoes.js   ← Todas as profissões
    ├── modelos/
    │   ├── Ficha.js
    │   ├── Elemento.js
    │   ├── Fonte.js
    │   └── Caracteristica.js
    └── ui/
        ├── uiAtributos.js
        ├── uiElementos.js
        ├── uiModal.js
        ├── uiRacaProfissao.js
        └── uiToast.js
```

## ⚙️ Como rodar localmente

Por usar ES6 modules, precisa de um servidor HTTP local.

**Opção 1 — VS Code:**
Instale a extensão **Live Server** e clique em "Go Live"

**Opção 2 — Node.js:**
```bash
npx serve .
```

**Opção 3 — Python:**
```bash
python3 -m http.server 8080
```
