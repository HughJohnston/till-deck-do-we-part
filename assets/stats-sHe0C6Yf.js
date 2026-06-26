import{t as e}from"./version-njuoM4cA.js";var t=`https://zdkhiwlsariquciwreua.supabase.co`,n=`sb_publishable_eLhrKiunIjV8-raF0ReOPA_iRLYdYAH`,r=1e4,i={total_time_ms:`Time on app`,games_played:`Games played`,best_score:`Best score`,longest_run_ms:`Longest run`,synergy_completions:`SYNERGY completes`,active_days:`Active days`,honeymoon_games:`Honeymoon runs`,name:`Name (A–Z)`};function a(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function o(e){let t=Math.max(0,Math.floor(e/1e3)),n=Math.floor(t/3600),r=Math.floor(t%3600/60),i=t%60;return n>0?`${n}h ${r}m`:r>0?`${r}m ${i}s`:`${i}s`}function s(e){if(!e)return`—`;try{return new Date(e).toLocaleDateString(void 0,{day:`numeric`,month:`short`,year:`numeric`})}catch{return`—`}}function c(e,t){switch(e){case`total_time_ms`:case`longest_run_ms`:return o(t[e]);case`name`:return t.name;default:return String(t[e]??0)}}async function l(){let e=new AbortController,i=setTimeout(()=>e.abort(),r);try{let r=await fetch(`${t}/rest/v1/player_stats?select=name,total_time_ms,games_played,best_score,longest_run_ms,synergy_completions,honeymoon_games,wilf_games,ruth_games,first_played_at,last_played_at,active_days&order=total_time_ms.desc&limit=500`,{headers:{apikey:n,Authorization:`Bearer ${n}`},signal:e.signal});if(!r.ok)throw Error(`HTTP ${r.status}`);let i=await r.json();if(!Array.isArray(i))throw Error(`Invalid response`);return i}finally{clearTimeout(i)}}function u(e){return{players:e.length,games:e.reduce((e,t)=>e+t.games_played,0),timeMs:e.reduce((e,t)=>e+t.total_time_ms,0),synergy:e.reduce((e,t)=>e+t.synergy_completions,0),wilf:e.reduce((e,t)=>e+t.wilf_games,0),ruth:e.reduce((e,t)=>e+t.ruth_games,0)}}function d(e,t,n=5,r){return[...e].sort((e,n)=>t===`name`?e.name.localeCompare(n.name):n[t]-e[t]).slice(0,n).map(e=>({name:e.name,value:r?r(e):c(t,e)}))}function f(e,t){let n=t.length===0?`<p class="sub">No data yet</p>`:t.map((e,t)=>`
        <div class="leader-row">
          <span class="leader-name">${t+1}. ${a(e.name)}</span>
          <span class="leader-val">${a(e.value)}</span>
        </div>
      `).join(``);return`
    <div class="card leader-card">
      <h2>${a(e)}</h2>
      ${n}
    </div>
  `}function p(e,t){return`
    <div class="table-wrap">
      <table>
        <thead>
    <tr>
      <th class="rank">#</th>
      <th>Player</th>
      <th class="num">Time</th>
      <th class="num">Games</th>
      <th class="num">Best</th>
      <th class="num">Longest</th>
      <th class="num">SYNERGY</th>
      <th class="num">Days</th>
      <th class="num">Wilf</th>
      <th class="num">Ruth</th>
      <th class="num">Hmoon</th>
      <th>Last seen</th>
    </tr>
  </thead>
        <tbody>${[...e].sort((e,n)=>t===`name`?e.name.localeCompare(n.name):n[t]-e[t]).map((e,t)=>`
    <tr>
      <td class="rank">${t+1}</td>
      <td class="name">${a(e.name)}</td>
      <td class="num">${o(e.total_time_ms)}</td>
      <td class="num">${e.games_played}</td>
      <td class="num">${e.best_score}</td>
      <td class="num">${o(e.longest_run_ms)}</td>
      <td class="num">${e.synergy_completions}</td>
      <td class="num">${e.active_days}</td>
      <td class="num">${e.wilf_games}</td>
      <td class="num">${e.ruth_games}</td>
      <td class="num">${e.honeymoon_games}</td>
      <td>${s(e.last_played_at)}</td>
    </tr>
  `).join(``)}</tbody>
      </table>
    </div>
  `}function m(e,t){let n=u(e),r=Object.keys(i).map(e=>`
    <option value="${e}"${e===t?` selected`:``}>${i[e]}</option>
  `).join(``);return`
    <section class="cards">
      <div class="card"><div class="card-label">Players</div><div class="card-value">${n.players}</div></div>
      <div class="card"><div class="card-label">Total games</div><div class="card-value">${n.games}</div></div>
      <div class="card"><div class="card-label">Total time</div><div class="card-value">${o(n.timeMs)}</div></div>
      <div class="card"><div class="card-label">SYNERGY completes</div><div class="card-value">${n.synergy}</div></div>
      <div class="card"><div class="card-label">Wilf runs</div><div class="card-value">${n.wilf}</div></div>
      <div class="card"><div class="card-label">Ruth runs</div><div class="card-value">${n.ruth}</div></div>
    </section>

    <section class="leaders">
      ${f(`Most time on app`,d(e,`total_time_ms`))}
      ${f(`Most games`,d(e,`games_played`))}
      ${f(`Best scores`,d(e,`best_score`))}
      ${f(`SYNERGY masters`,d(e,`synergy_completions`))}
    </section>

    <div class="toolbar">
      <label for="sort">Sort table by</label>
      <select id="sort">${r}</select>
      <button type="button" id="refresh">Refresh</button>
    </div>

    <section class="panel">
      ${e.length===0?`<p class="status">No player stats yet — play a run on the game first.</p>`:p(e,t)}
    </section>
  `}var h=[],g=`total_time_ms`;function _(){document.getElementById(`sort`)?.addEventListener(`change`,e=>{g=e.target.value;let t=document.getElementById(`app`);t&&(t.innerHTML=m(h,g)),_()}),document.getElementById(`refresh`)?.addEventListener(`click`,()=>{y()})}function v(e){h=e;let t=document.getElementById(`app`);t&&(t.innerHTML=m(e,g),_())}async function y(){let t=document.getElementById(`app`),n=document.getElementById(`footer`);if(t){t.innerHTML=`<p class="status">Loading stats…</p>`,n&&(n.textContent=`${e} · stats dashboard`);try{v(await l())}catch(e){let n=e instanceof Error?e.message:`Unknown error`,r=n.includes(`404`);t.innerHTML=`
      <p class="status error">Could not load stats: ${a(n)}</p>
      <p class="status">${r?`The <code>player_stats</code> table is missing in Supabase. Open the SQL editor for your project, paste the contents of <code>supabase/player_stats.sql</code>, and run it once.`:`Check your Supabase credentials and that <code>supabase/player_stats.sql</code> has been applied.`}</p>
    `}}}y();