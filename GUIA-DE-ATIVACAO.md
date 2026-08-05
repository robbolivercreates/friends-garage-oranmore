# Friends Garage — Guia de Ativação (para a cliente)

## Como vai ficar quando estiver no ar — o quadro completo

**O que os clientes veem:**
- Site no ar em `friendsgarage.ie` (ou o domínio escolhido), com vídeo da
  oficina na página inicial, fotos reais da equipe e do espaço
- Agendamento online em 5 passos — o cliente escolhe serviço, placa, data e
  horário (o sistema só mostra vagas reais: domingo, feriados e horários
  ocupados são bloqueados automaticamente)
- Pedido de orçamento, pedido de "me ligue de volta" e página de emergência
  na estrada
- O cliente recebe e-mail na hora (pedido recebido) e outro quando a equipe
  confirma — com convite de calendário anexado

**O que a equipe recebe e faz:**
- E-mail instantâneo para a oficina a cada novo pedido (agendamento,
  orçamento, callback ou emergência 🚨) — com convite de calendário para
  adicionar ao Google Calendar com um toque
- **Painel da equipe** (link "Staff Login" no rodapé do site): é a agenda da
  oficina. Nele a equipe:
  - Confirma, remarca, conclui ou cancela agendamentos — **tudo pode ser
    desfeito**: o seletor de status permite voltar atrás em qualquer ação, e
    "Reschedule" move data/horário livremente. O cliente é avisado por
    e-mail automaticamente a cada mudança
  - Tem botão de **WhatsApp** pronto em cada pedido (abre conversa com
    mensagem pré-escrita)
  - Bloqueia feriados e dias de fechamento (aba Blocked Dates)
  - Ajusta horários, telefones e capacidade diária (aba Site Settings)
  - Exporta tudo em CSV (Excel)
  - Adiciona notas internas por agendamento
- Nenhuma ação exige conhecimento técnico.

**O que acontece sozinho (sem ninguém tocar):**
- Bloqueio de horários ocupados, domingos e feriados
- E-mails de confirmação/remarcação/cancelamento para o cliente
- Números de referência de cada pedido (FG-2026-XXXX)
- Registro de tudo no banco de dados (SQLite, com backup simples)

**O que falta para ligar (só a cliente pode fazer):** ver passos 1 a 4 abaixo.

---

Este guia explica, em linguagem simples, o que a oficina precisa fazer para
colocar o site 100% no ar. Nada aqui exige conhecimento técnico — são apenas
criações de conta. Qualquer dúvida, fale com o desenvolvedor.

---

## 1. E-mail automático (obrigatório para ir ao ar)

Sem isso, os e-mails de confirmação ficam apenas registrados internamente
(nada se perde — ficam em `data/outbox.json`). Para ativar o envio real:

1. Crie (ou use) uma conta Gmail para a oficina, ex: `friendsgarage@gmail.com`
2. Ative a verificação em 2 etapas: https://myaccount.google.com/security
3. Crie uma "Senha de app": https://myaccount.google.com/apppasswords
   (nome sugerido: "Site Friends Garage") — o Google mostra uma senha de 16 letras
4. Envie essa senha de app ao desenvolvedor, ou edite o arquivo `.env` na
   pasta do site:

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="friendsgarage@gmail.com"
SMTP_PASS="aaaa bbbb cccc dddd"     ← a senha de app
GARAGE_NOTIFY_EMAIL="email-que-a-equipe-le@..."
```

5. Reinicie o servidor. Pronto — clientes e equipe passam a receber e-mails.

## 2. Google Calendar da equipe (opcional, recomendado)

Já funciona **sem configurar nada**: cada e-mail de agendamento chega com um
convite de calendário anexado — a equipe abre o e-mail no celular e toca em
"Adicionar ao calendário".

Para sincronização **automática** (agendamentos confirmados caem direto no
Google Calendar da oficina), é preciso criar uma credencial no Google Cloud.
Peça ao desenvolvedor — são ~15 minutos com a conta Google da oficina.

## 3. Banco de dados

O sistema usa **SQLite** (arquivo `data/friendsgarage.db`) — banco de dados
profissional com transações atômicas. Não precisa de nenhuma conta externa.

**Backup:** basta copiar o arquivo `data/friendsgarage.db` de vez em quando
(ou configurar backup automático no servidor onde o site ficar hospedado).

Se no futuro a oficina quiser acessar os dados de vários lugares com painel
web, dá para migrar para Supabase (Postgres hospedado, grátis no plano
inicial) — o código já está preparado para essa troca.

## 4. Hospedagem (para o site sair do computador e ir para a internet)

Opções simples que rodam este projeto como está:

- **Render / Railway / Fly.io** — sobem o projeto direto (`npm run build && npm start`)
- **VPS (Hostinger, Hetzner, etc.)** — mais controle, ~€5/mês

Depois é só apontar o domínio (ex: friendsgarage.net) para o servidor.
O desenvolvedor pode fazer esse processo inteiro.

## 5. Senha do painel da equipe

Atual: `friends2026`. Para trocar, edite `server.ts` (endpoint
`/api/admin/login`) ou peça ao desenvolvedor.

## 6. Google Tag Manager / Facebook Pixel (opcional)

O site já está preparado. Basta:

1. Criar um container gratuito em https://tagmanager.google.com
2. Pegar o ID (formato `GTM-XXXXXXX`)
3. Entregar ao desenvolvedor, ou definir `VITE_GTM_ID` no `.env` e rodar
   `npm run build` novamente

O GTM só carrega depois que o visitante aceita os cookies (conforme GDPR).
O **Facebook Pixel** não precisa de código: instala-se dentro do próprio
Tag Manager pelo painel do Google.

---

### Resumo do que já funciona hoje, sem nenhuma conta externa

- Site completo com agendamento online, orçamentos, callbacks e emergências
- Painel da equipe com gestão de agenda, feriados e capacidade diária
- Botões de WhatsApp prontos em cada pedido
- E-mails registrados internamente (ativam envio real no passo 1)
- Convites de calendário anexados aos e-mails
