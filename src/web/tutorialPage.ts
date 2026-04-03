function featureCard(title: string, items: string[], accent: string): string {
  return `
    <section class="card" style="--accent:${accent}">
      <h3>${title}</h3>
      <ul>
        ${items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </section>
  `;
}

export function renderTutorialPage(): string {
  const moderation = featureCard(
    'Sesepuh Control',
    [
      '<code>/bless</code> kasih buff random ke Sesepuh online, durasi 10 menit, immune curse, priority voice, dan flair emas.',
      '<code>/curse</code> bisa timeout target biasa atau lempar status miskin random ke satu korban online.',
      '<code>/summon</code> punya filter online/offline, role, game, pressure mode, dan punish mode.',
      '<code>/statusrole</code> audit role Blessed dan miskin, termasuk hierarchy dan permission bot.',
    ],
    '#f1c40f'
  );

  const mabar = featureCard(
    'Mabar Ops',
    [
      '<code>/jadwal</code> bikin war room mabar lengkap dengan reminder otomatis.',
      '<code>/balance</code> bagi tim lebih rata berdasarkan histori circle.',
      '<code>/votemap</code> voting map atau mode biar lobby nggak ribet.',
      '<code>/match</code> catat hasil match, MVP, carry, beban, dan dampaknya ke leaderboard.',
    ],
    '#5865f2'
  );

  const fun = featureCard(
    'Circle Fun',
    [
      '<code>/spin</code> kasih tantangan random, tapi role miskin nggak bisa pakai ini.',
      '<code>/team</code> generate tim cepat dari VC atau member online.',
      '<code>/soundboard</code> kirim meme soundboard versi chat/TTS.',
      '<code>/sesepuh</code> untuk nasihat, keputusan, dan roastmode khas circle.',
    ],
    '#57f287'
  );

  const lore = featureCard(
    'Lore & Memory',
    [
      '<code>/remember @user catatan</code> simpan sejarah receh atau reputasi member.',
      '<code>/lore @user</code> tampilkan identitas khas member, contohnya: tukang AFK sejak 2024.',
      '<code>/tutorial</code> buka panduan singkat per topik langsung dari Discord.',
      '<code>/misi</code>, <code>/streak</code>, dan <code>/circle</code> bikin aktivitas circle punya progres jangka panjang.',
    ],
    '#eb459e'
  );

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sesepuh Bot Tutorial</title>
    <style>
      :root {
        --bg: #313338;
        --panel: #1e1f22;
        --panel-soft: #2b2d31;
        --text: #f2f3f5;
        --muted: #b5bac1;
        --line: #3f4147;
        --brand: #5865f2;
        --gold: #f1c40f;
        --green: #57f287;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "gg sans", "Segoe UI", Tahoma, sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(88,101,242,.22), transparent 26%),
          radial-gradient(circle at top right, rgba(235,69,158,.15), transparent 20%),
          linear-gradient(180deg, #232428 0%, #313338 55%, #2b2d31 100%);
      }

      .shell {
        width: min(1180px, calc(100vw - 32px));
        margin: 24px auto;
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 20px;
      }

      .sidebar, .content {
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 24px;
        backdrop-filter: blur(10px);
        box-shadow: 0 24px 80px rgba(0,0,0,.32);
      }

      .sidebar {
        background: rgba(30,31,34,.92);
        padding: 18px;
        position: sticky;
        top: 24px;
        height: fit-content;
      }

      .guild {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--line);
      }

      .guild-badge {
        width: 54px;
        height: 54px;
        border-radius: 18px;
        background: linear-gradient(135deg, var(--brand), #7d86ff);
        display: grid;
        place-items: center;
        font-weight: 800;
        font-size: 22px;
      }

      .guild small, .sidebar p, .pill, .channel {
        color: var(--muted);
      }

      .channel-list {
        margin-top: 18px;
        display: grid;
        gap: 10px;
      }

      .channel {
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255,255,255,.02);
      }

      .channel.active {
        color: var(--text);
        background: rgba(88,101,242,.16);
        border: 1px solid rgba(88,101,242,.35);
      }

      .content {
        background: rgba(43,45,49,.88);
        overflow: hidden;
      }

      .hero {
        padding: 34px 34px 18px;
        border-bottom: 1px solid var(--line);
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 18px;
      }

      .pill {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.06);
        border: 1px solid rgba(255,255,255,.08);
        font-size: 13px;
      }

      h1, h2, h3, p { margin: 0; }

      h1 {
        font-size: clamp(34px, 5vw, 56px);
        line-height: 1.02;
        letter-spacing: -0.03em;
        margin-bottom: 12px;
      }

      .hero p {
        max-width: 760px;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.7;
      }

      .grid {
        padding: 24px 24px 32px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }

      .card {
        --accent: var(--brand);
        background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 22px;
        padding: 20px;
        position: relative;
        overflow: hidden;
      }

      .card::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 4px;
        background: var(--accent);
      }

      .card h3 {
        font-size: 20px;
        margin-bottom: 14px;
      }

      .card ul {
        margin: 0;
        padding-left: 18px;
        color: var(--muted);
        line-height: 1.7;
      }

      .card li + li { margin-top: 8px; }

      code {
        background: rgba(17,18,20,.8);
        color: #fff;
        border: 1px solid rgba(255,255,255,.06);
        padding: 2px 7px;
        border-radius: 8px;
        font-family: Consolas, monospace;
        font-size: .93em;
      }

      .footer {
        margin: 0 24px 26px;
        padding: 18px 20px;
        border-radius: 20px;
        background: linear-gradient(90deg, rgba(88,101,242,.14), rgba(87,242,135,.08));
        border: 1px solid rgba(255,255,255,.06);
      }

      .footer h2 {
        font-size: 20px;
        margin-bottom: 8px;
      }

      .footer p {
        color: var(--muted);
        line-height: 1.7;
      }

      @media (max-width: 900px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: static;
        }

        .grid {
          grid-template-columns: 1fr;
        }

        .hero {
          padding: 26px 20px 18px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <aside class="sidebar">
        <div class="guild">
          <div class="guild-badge">SB</div>
          <div>
            <strong>Sesepuh Bot</strong><br />
            <small>Circle Edition</small>
          </div>
        </div>
        <p style="margin-top:16px; line-height:1.7;">
          Halaman ini cocok buat para Sesepuh yang mau cepat paham fitur bot tanpa buka file satu-satu.
        </p>
        <div class="channel-list">
          <div class="channel active"># tutorial-bot</div>
          <div class="channel"># summon-control</div>
          <div class="channel"># mabar-ops</div>
          <div class="channel"># memory-lore</div>
          <div class="channel"># fun-pack</div>
        </div>
      </aside>

      <section class="content">
        <header class="hero">
          <div class="pill-row">
            <span class="pill">Railway Ready</span>
            <span class="pill">Discord Styled</span>
            <span class="pill">20 Slash Commands</span>
          </div>
          <h1>Sesepuh Bot Tutorial Hub</h1>
          <p>
            Satu halaman buat ngeliat fitur-fitur utama bot, mulai dari summon dan punish,
            sampai lore system yang bikin circle punya sejarah sendiri. Publish bareng bot di Railway,
            buka dari browser, dan share ke member biar semua langsung paham.
          </p>
        </header>

        <section class="grid">
          ${moderation}
          ${mabar}
          ${fun}
          ${lore}
        </section>

        <section class="footer">
          <h2>Command Cepat</h2>
          <p>
            Untuk panduan singkat di Discord, pakai <code>/tutorial</code>. Untuk audit role,
            pakai <code>/statusrole</code>. Kalau mau bikin lore jangka panjang, pakai
            <code>/remember</code> lalu cek hasilnya lewat <code>/lore</code>.
          </p>
        </section>
      </section>
    </main>
  </body>
</html>`;
}
