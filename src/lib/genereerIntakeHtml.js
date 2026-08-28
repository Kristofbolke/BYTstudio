// genereerIntakeHtml.js — Genereert een volledig zelfstandig HTML-intakeformulier
// (geen externe dependencies, verzending via mailto: als fallback zonder server)

const LOGO_B64 = "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"

export function genereerIntakeFormulierHtml() {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>Intakeformulier — Build Your Tools</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #1a1a1a; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 40px 16px 80px; }
  .kop { text-align: center; margin-bottom: 32px; }
  .kop h1 { color: #fff; font-size: 24px; margin: 12px 0 4px; }
  .kop p { color: #94a3b8; font-size: 14px; margin: 0; }
  .voortgang { margin-bottom: 24px; }
  .voortgang-tekst { display: flex; justify-content: space-between; color: #cbd5e1; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .voortgang-balk { height: 6px; border-radius: 999px; background: #334155; overflow: hidden; }
  .voortgang-vulling { height: 100%; background: #22C35D; border-radius: 999px; transition: width .2s; }
  .kaart { background: #fff; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.25); padding: 28px; display: none; }
  .kaart.actief { display: block; }
  .kaart h2 { margin: 0 0 16px; font-size: 18px; }
  label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin: 14px 0 5px; }
  label.verplicht:after { content: " *"; color: #ef4444; }
  input[type=text], input[type=email], input[type=tel], input[type=date], select, textarea {
    width: 100%; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #e5e7eb;
    font-size: 14px; font-family: inherit; background: #fff;
  }
  textarea { resize: vertical; }
  .opties { display: grid; gap: 8px; margin-top: 4px; }
  .opties.tweekolom { grid-template-columns: 1fr 1fr; }
  .optie { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; cursor: pointer; font-size: 14px; }
  .optie input { margin: 0; }
  .optie.actief { border-color: #22C35D; background: #22C35D0d; font-weight: 600; }
  .toggle-rij { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px; }
  .toggle-rij button { padding: 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; color: #6b7280; }
  .toggle-rij button.actief { border-color: #22C35D; background: #22C35D0d; color: #111827; }
  .info-blok { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 12px 14px; border-radius: 10px; font-size: 14px; margin-top: 10px; }
  .nav { display: flex; gap: 12px; margin-top: 20px; }
  .btn { flex: 1; padding: 14px; border-radius: 12px; border: none; font-size: 15px; font-weight: 700; cursor: pointer; }
  .btn-primair { background: #22C35D; color: #fff; }
  .btn-terug { flex: 0 0 auto; background: transparent; border: 1.5px solid #475569; color: #cbd5e1; }
  .bedank { display: none; text-align: center; background: #fff; border-radius: 16px; padding: 40px 28px; }
  .bedank.actief { display: block; }
  .vinkje { width: 56px; height: 56px; border-radius: 999px; background: #22C35D1a; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; color: #22C35D; }
  .voettekst { text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="kop">
    <img src="data:image/png;base64,${LOGO_B64}" alt="Build Your Tools" style="height:40px;margin:0 auto;display:block;">
    <h1>Vertel ons over uw project</h1>
    <p>Wij nemen binnen 2 werkdagen contact met u op.</p>
  </div>

  <div class="voortgang" id="voortgangBlok">
    <div class="voortgang-tekst"><span id="stapLabel">Stap 1 van 7</span><span id="stapTitel">Uw bedrijf</span></div>
    <div class="voortgang-balk"><div class="voortgang-vulling" id="voortgangVulling" style="width:14.28%"></div></div>
  </div>

  <form id="intakeForm">
    <div class="kaart actief" data-stap="1">
      <h2>Uw bedrijf</h2>
      <label class="verplicht">Bedrijfsnaam</label>
      <input type="text" name="bedrijfsnaam" required>
      <label class="verplicht">Contactpersoon naam</label>
      <input type="text" name="contactpersoon_naam" required>
      <label>Functie/rol</label>
      <input type="text" name="contactpersoon_functie">
      <label class="verplicht">E-mailadres</label>
      <input type="email" name="contactpersoon_email" required>
      <label>Telefoon</label>
      <input type="tel" name="contactpersoon_telefoon">
      <label>Website</label>
      <input type="text" name="website">
      <label>Sector</label>
      <input type="text" name="sector" placeholder="Bv. Horeca, Bouw, Zorg...">
      <label>Aantal medewerkers</label>
      <select name="aantal_medewerkers">
        <option value="">— Kies —</option>
        <option>1-5</option><option>6-15</option><option>16-50</option><option>50+</option>
      </select>
      <label>Ondernemingsvorm</label>
      <select name="ondernemingsvorm">
        <option value="">— Kies —</option>
        <option>Eenmanszaak</option><option>BV</option><option>NV</option><option>VZW</option><option>Andere</option>
      </select>
      <label>Adres</label>
      <input type="text" name="adres">
    </div>

    <div class="kaart" data-stap="2">
      <h2>Heeft u al een huisstijl?</h2>
      <div class="toggle-rij">
        <button type="button" data-huisstijl="ja">Ja</button>
        <button type="button" data-huisstijl="nee">Nee</button>
      </div>
      <div id="huisstijlJa" style="display:none">
        <label>Beschrijf uw huisstijl</label>
        <textarea name="huisstijl_beschrijving" rows="3" placeholder="Kleuren, lettertype, sfeer..."></textarea>
        <p style="font-size:12px;color:#6b7280;">Logo/stijldocument kan u na het versturen als bijlage mailen naar kristof@jogoo.be.</p>
      </div>
      <div id="huisstijlNee" class="info-blok" style="display:none">Geen probleem — BYT Studio helpt u een huisstijl te ontwikkelen.</div>
      <input type="hidden" name="heeft_huisstijl">
    </div>

    <div class="kaart" data-stap="3">
      <h2>Uw uitdaging</h2>
      <label>Hoe werkt u vandaag?</label>
      <textarea name="huidige_werkwijze" rows="3"></textarea>
      <label class="verplicht">Wat loopt er niet goed?</label>
      <textarea name="grootste_pijnpunt" rows="3" required></textarea>
      <label>Hoeveel tijd verliest u hieraan?</label>
      <select name="tijd_verloren">
        <option value="">— Kies —</option>
        <option>Minder dan 1u/dag</option><option>1-2u/dag</option><option>2-4u/dag</option>
        <option>Meer dan 4u/dag</option><option>Weet niet</option>
      </select>
      <label>Heeft u al een oplossing geprobeerd?</label>
      <textarea name="eerder_geprobeerd" rows="3"></textarea>
    </div>

    <div class="kaart" data-stap="4">
      <h2>De gewenste app</h2>
      <label>Type app</label>
      <div class="opties" data-radio="type_app">
        ${['Web app (desktop + laptop)', 'Mobiele app (smartphone)', 'PWA (werkt op alle toestellen)', 'Intern beheersysteem', 'Klanten-portaal', 'Nog geen idee']
          .map(o => `<label class="optie"><input type="radio" name="type_app" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label class="verplicht">Wat moet de app doen?</label>
      <textarea name="omschrijving_app" rows="4" required></textarea>
      <label>Kent u een app die lijkt op wat u wil?</label>
      <input type="text" name="vergelijkbaar_voorbeeld">
      <label>Prioriteit</label>
      <select name="prioriteit">
        <option value="">— Kies —</option>
        <option>Zo snel mogelijk</option><option>Binnen 3 maanden</option><option>Binnen 6 maanden</option><option>Geen haast</option>
      </select>
      <label>Budget indicatie</label>
      <div class="opties" data-radio="budget_indicatie">
        ${['Minder dan €1.500 (Starter)', '€1.500 - €3.000 (Business)', '€3.000 - €6.000 (Pro)', 'Meer dan €6.000 (Enterprise)', 'Nog niet bepaald']
          .map(o => `<label class="optie"><input type="radio" name="budget_indicatie" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label>Gewenste opleverdatum</label>
      <input type="date" name="gewenste_opleverdatum">
    </div>

    <div class="kaart" data-stap="5">
      <h2>Wat moet de app kunnen?</h2>
      <div class="opties tweekolom">
        ${['Login & gebruikersbeheer', 'Dashboard met statistieken', 'Klantenbeheer', 'Reservatiesysteem',
           'Online boekingsformulier', 'Facturen maken', 'Offertes maken', 'Betalingsopvolging',
           'Personeelsplanning', 'Productbeheer', 'Bestellingsbeheer', 'E-mail notificaties',
           'Chatbot voor klanten', 'Koppeling boekhoudpakket', 'Export naar Excel/PDF',
           'Statistieken & grafieken', 'Meertalig', 'Mobiele app (PWA)']
          .map(o => `<label class="optie"><input type="checkbox" name="features" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
    </div>

    <div class="kaart" data-stap="6">
      <h2>Technisch &amp; gebruikers</h2>
      <label>Apparaten</label>
      <div class="opties tweekolom">
        ${['Desktop/laptop', 'Smartphone', 'Tablet', 'Kassa/POS systeem']
          .map(o => `<label class="optie"><input type="checkbox" name="apparaten" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label>Wie gebruikt de app</label>
      <div class="opties" data-radio="gebruikers_type">
        ${['Alleen onze medewerkers', 'Alleen onze klanten', 'Zowel medewerkers als klanten']
          .map(o => `<label class="optie"><input type="radio" name="gebruikers_type" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label>Aantal gebruikers</label>
      <select name="aantal_gebruikers">
        <option value="">— Kies —</option>
        <option>1-5</option><option>6-20</option><option>21-100</option><option>100+</option>
      </select>
      <label>IT-bekwaamheid gebruikers</label>
      <select name="it_bekwaamheid">
        <option value="">— Kies —</option>
        <option>Beginner</option><option>Gemiddeld</option><option>Gevorderd</option>
      </select>
      <label>Interface taal</label>
      <div class="opties tweekolom">
        ${['Nederlands', 'Frans', 'Engels'].map(o => `<label class="optie"><input type="checkbox" name="interface_talen" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label>Met welke software moet de app koppelen? (bv. Exact, Woocommerce)</label>
      <textarea name="integraties_nodig" rows="2"></textarea>
    </div>

    <div class="kaart" data-stap="7">
      <h2>Afronden</h2>
      <label>Hosting voorkeur</label>
      <div class="opties" data-radio="hosting_voorkeur">
        ${['Netlify (aanbevolen)', 'Vercel', 'Bestaande hosting behouden', 'Geen voorkeur']
          .map(o => `<label class="optie"><input type="radio" name="hosting_voorkeur" value="${o}"> ${o}</label>`).join('\n        ')}
      </div>
      <label>Technische kennis bedrijf</label>
      <select name="technische_kennis_bedrijf">
        <option value="">— Kies —</option>
        <option>Geen IT</option><option>Basis IT kennis</option><option>Eigen IT afdeling</option><option>Externe IT partner</option>
      </select>
      <label>Opmerkingen of vragen</label>
      <textarea name="opmerkingen" rows="3"></textarea>
    </div>

    <div class="nav">
      <button type="button" class="btn btn-terug" id="btnTerug" style="display:none">← Vorige</button>
      <button type="button" class="btn btn-primair" id="btnVolgende">Volgende →</button>
      <button type="submit" class="btn btn-primair" id="btnVersturen" style="display:none">Verstuur mijn aanvraag →</button>
    </div>
  </form>

  <div class="bedank" id="bedankBlok">
    <div class="vinkje">✓</div>
    <h1 id="bedankTitel" style="font-size:20px;margin:0 0 8px;">Bedankt!</h1>
    <p style="color:#4b5563;font-size:14px;">We nemen binnen 2 werkdagen contact met u op.</p>
  </div>

  <p class="voettekst">© BYT — Build Your Tools</p>
</div>

<script>
(function () {
  var STAPPEN = ['Uw bedrijf','Uw huisstijl','Uw uitdaging','De gewenste app','Gewenste features','Technisch & gebruikers','Afronden'];
  var stap = 1;
  var form = document.getElementById('intakeForm');

  function toonStap(n) {
    document.querySelectorAll('.kaart').forEach(function (k) { k.classList.toggle('actief', +k.dataset.stap === n); });
    document.getElementById('stapLabel').textContent = 'Stap ' + n + ' van 7';
    document.getElementById('stapTitel').textContent = STAPPEN[n - 1];
    document.getElementById('voortgangVulling').style.width = (n / 7 * 100) + '%';
    document.getElementById('btnTerug').style.display = n > 1 ? '' : 'none';
    document.getElementById('btnVolgende').style.display = n < 7 ? '' : 'none';
    document.getElementById('btnVersturen').style.display = n === 7 ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('btnVolgende').addEventListener('click', function () {
    var kaart = document.querySelector('.kaart[data-stap="' + stap + '"]');
    var verplicht = kaart.querySelectorAll('[required]');
    for (var i = 0; i < verplicht.length; i++) {
      if (!verplicht[i].value.trim()) { verplicht[i].focus(); verplicht[i].reportValidity(); return; }
    }
    stap = Math.min(7, stap + 1);
    toonStap(stap);
  });
  document.getElementById('btnTerug').addEventListener('click', function () {
    stap = Math.max(1, stap - 1);
    toonStap(stap);
  });

  // Radiokaarten visuele state
  document.querySelectorAll('[data-radio]').forEach(function (groep) {
    groep.querySelectorAll('input[type=radio]').forEach(function (r) {
      r.addEventListener('change', function () {
        groep.querySelectorAll('.optie').forEach(function (o) { o.classList.remove('actief'); });
        r.closest('.optie').classList.add('actief');
      });
    });
  });
  document.querySelectorAll('.opties.tweekolom input[type=checkbox]').forEach(function (c) {
    c.addEventListener('change', function () { c.closest('.optie').classList.toggle('actief', c.checked); });
  });

  // Huisstijl toggle
  var heeftHuisstijl = document.querySelector('input[name=heeft_huisstijl]');
  document.querySelectorAll('[data-huisstijl]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-huisstijl]').forEach(function (b) { b.classList.remove('actief'); });
      btn.classList.add('actief');
      var ja = btn.dataset.huisstijl === 'ja';
      heeftHuisstijl.value = ja ? 'true' : 'false';
      document.getElementById('huisstijlJa').style.display = ja ? '' : 'none';
      document.getElementById('huisstijlNee').style.display = ja ? 'none' : '';
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var verplicht = form.querySelectorAll('[required]');
    for (var i = 0; i < verplicht.length; i++) {
      if (!verplicht[i].value.trim()) { verplicht[i].focus(); verplicht[i].reportValidity(); return; }
    }
    var data = new FormData(form);
    var regels = [];
    var gezien = {};
    for (var pair of data.entries()) {
      var key = pair[0], val = pair[1];
      if (!val) continue;
      if (gezien[key]) { gezien[key] += ', ' + val; } else { gezien[key] = val; regels.push(key); }
    }
    var naam = gezien['contactpersoon_naam'] || '';
    var bedrijf = gezien['bedrijfsnaam'] || '';
    var body = 'Nieuwe aanvraag via het intakeformulier.\\n\\n';
    regels.forEach(function (key) { body += key + ': ' + gezien[key] + '\\n'; });
    var mailto = 'mailto:kristof@jogoo.be?subject=' + encodeURIComponent('Nieuwe lead: ' + bedrijf)
      + '&body=' + encodeURIComponent(body);
    window.location.href = mailto;

    document.getElementById('bedankTitel').textContent = 'Bedankt ' + (naam.split(' ')[0] || '') + '!';
    form.style.display = 'none';
    document.getElementById('voortgangBlok').style.display = 'none';
    document.getElementById('bedankBlok').classList.add('actief');
  });
})();
</script>
</body>
</html>
`
}
