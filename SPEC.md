# Editor de Fotos Online — Spec Inicial

## Objetivo

Projeto pessoal de estudo. Editor de fotos no browser, estilo Photoshop simplificado, com foco em camadas e seleção. Sem backend — tudo roda no frontend.

---

## Regras de Negócio

1. **Projeto** = conjunto de camadas + histórico de ações, existe apenas na sessão do browser (não há login nem conta).
2. **Camada** é a unidade base de edição:
   - Tem imagem, posição, tamanho, rotação, opacidade e ordem (z-index).
   - Pode ser reordenada, escondida, duplicada ou apagada.
   - Camada ativa é a única editável num dado momento.
3. **Seleção** delimita a área afetada por uma operação (crop, filtro, apagar):
   - Sem seleção ativa, a operação aplica-se à camada inteira.
   - Seleção é sempre relativa à camada ativa, não ao canvas global.
4. **Histórico (undo/redo)**:
   - Toda ação editável (mover, filtro, crop, criar/apagar camada) gera uma entrada no histórico.
   - Limite de histórico definido por memória disponível (sem persistência entre sessões na v1).
5. **Persistência**:
   - v1: nenhuma — fechar o browser perde o projeto.
   - v2 (futuro, fora de escopo agora): salvar em `localStorage`/`IndexedDB`.
6. **Export**: usuário pode exportar o resultado final como PNG/JPEG a qualquer momento, sem afetar o estado do projeto em edição.

---

## Escopo

### Dentro do escopo (MVP)
- Upload de imagem (input local, sem servidor)
- Sistema de camadas: adicionar, reordenar, esconder, duplicar, apagar
- Transformações: mover, redimensionar, rotacionar (via handles)
- Seleção retangular + crop
- Filtros básicos por manipulação de pixel: brilho, contraste, saturação
- Undo/redo
- Export para PNG/JPEG

### Fora do escopo (v1)
- Contas de usuário / login
- Salvar projeto na nuvem
- Colaboração em tempo real
- Seleção avançada (laço, varinha mágica) — candidato a v2
- Blend modes entre camadas — candidato a v2
- Processamento via IA (remoção de fundo, upscale, etc.) — candidato a v3

---

## Tech Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Framework | React | Requisito do projeto |
| Renderização de canvas | Konva.js + react-konva | Modelo Stage → Layer → Shape se encaixa bem com sistema de camadas; handles de seleção/transform prontos |
| Estado global | Zustand | Leve, suficiente para lista de camadas + histórico, menos boilerplate que Redux |
| Manipulação de pixel | Canvas API nativa (`getImageData`/`putImageData`) | Necessário para filtros que vão além de CSS filters |
| Processamento pesado (futuro) | Web Workers | Evitar travar a UI em imagens grandes |
| Persistência (futuro) | IndexedDB | Suporta melhor blobs de imagem que localStorage |
| Build | Vite | Setup rápido para SPA React |

---

## Arquitetura (visão geral)

```
Stage (Konva)
 └─ Layer visual (por camada de imagem do usuário)
     └─ Image / Shape (conteúdo da camada)
         └─ Transformer (quando camada está selecionada)

Zustand store:
 - layers: [{ id, image, x, y, width, height, rotation, opacity, visible, zIndex }]
 - activeLayerId
 - selection: { type, bounds } | null
 - history: [ ...comandos reversíveis ]
```

---

## Próximos passos
1. Scaffold do projeto (Vite + React + Konva)
2. Upload + render de imagem numa camada
3. CRUD básico de camadas
4. Transform (mover/resize/rotate)
5. Crop via seleção retangular
6. Filtro de brilho/contraste (pixel manipulation)
7. Undo/redo