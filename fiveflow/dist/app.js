import { getDayProfile, getJapanToday, getElementRelation } from './calendar.js';
import { setupVoice } from './voice.js';
import './loading.js';

const $ = id => document.getElementById(id);
const state = { lang: navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en', person: null, today: null, relation: null, place: null, liveResults: {}, requestId: 0, controller: null, step: 1 };
let voice;
const copy = {
  en: {
    yourElement:'YOUR ELEMENT', todayElement:"TODAY’S ELEMENT", dayMaster:'Day Master', todayStem:'Day stem', dayPillar:'Day pillar', jst:'JAPAN TIME',
    relationLabel:'THE CONNECTION', yourTheme:'TODAY’S INVITATION', searchArea:'YOUR CHOSEN AREA', resultLabel:'YOUR LUCKY EXPERIENCE', locationLabel:'THE PLACE', actionLabel:'THE LITTLE ADVENTURE', luckLabel:'TODAY’S INTENTION', reasonLabel:'WHY THIS FOR YOU', source:'Official visitor information ↗', map:'Open in Google Maps ↗', demoLabel:'CURATED DEMO · NOT LIVE SEARCH', checkHours:'Check the official source for opening hours and availability.', noMatch:'For this preview, try Shinjuku, Shibuya, or Asakusa. Live place search is not connected yet.', needPlace:'Enter a destination to continue.', needBirthday:'Please enter a valid birthday, no later than today.',
    voiceUnsupported:'Voice input is not available in this browser. You can type instead.', voiceListening:'Listening… tell us where you want to go.', voiceError:'Could not hear that. Please try again or type your destination.', voiceDone:'You can edit the recognized text before continuing.',
    reason:'We paired today’s symbolic theme with a real place in your selected area. The activity is our own suggestion.',
    dateNote:'Simple day-stem reading · civil-date rollover at midnight · cultural inspiration, not a full birth chart.',
    relations:{same:['Same element','A moment to notice what feels familiar.'],supported:['Today nourishes your element','Make space to receive and discover.'],expressing:['Your element nourishes today','Give an idea room to take shape.'],constrained:['Today checks your element','Find balance at your own pace.'],directing:['Your element checks today','Bring intention to one small choice.']},
    elements:{wood:['木','Wood','Growth','Notice something growing around you.'],fire:['火','Fire','Expression','Find a detail that sparks your imagination.'],earth:['土','Earth','Grounding','Slow down and make room to feel settled.'],metal:['金','Metal','Clarity','Choose one detail and give it your full attention.'],water:['水','Water','Inspiration','Let a quiet moment make space for a new idea.']},
  },
  ja: {
    yourElement:'あなたの五行', todayElement:'今日の五行', dayMaster:'日主', todayStem:'今日の日干', dayPillar:'日柱', jst:'日本時間',
    relationLabel:'ふたつのつながり', yourTheme:'今日のインビテーション', searchArea:'選んだエリア', resultLabel:'今日の開運アクション', locationLabel:'行く場所', actionLabel:'小さな体験', luckLabel:'今日のテーマ', reasonLabel:'あなたへのおすすめ理由', source:'公式・観光情報を見る ↗', map:'Google マップで見る ↗', demoLabel:'サンプル情報 · リアルタイム検索ではありません', checkHours:'営業時間や利用状況は公式情報をご確認ください。', noMatch:'プレビューでは「新宿」「渋谷」「浅草」からお選びください。リアルタイム検索は準備中です。', needPlace:'行きたい場所を入力してください。', needBirthday:'今日以前の有効な生年月日を入力してください。',
    voiceUnsupported:'このブラウザでは音声入力を利用できません。文字で入力してください。', voiceListening:'聞いています…行きたい場所を教えてください。', voiceError:'聞き取れませんでした。もう一度話すか、文字で入力してください。', voiceDone:'認識した文字を確認・修正してから進めます。',
    reason:'今日の象徴的なテーマと、選んだエリアの実在する場所を組み合わせました。体験内容は本サービスからの提案です。',
    dateNote:'日干による簡易鑑定 · 日付は午前0時に切り替わります · 完全な命式ではなく文化体験です。',
    relations:{same:['同じ五行','身近なものの魅力に目を向けるひととき。'],supported:['今日があなたを育む','新しい発見を受け取る余白を。'],expressing:['あなたが今日を育む','思いつきを少しずつ形にしてみましょう。'],constrained:['今日とのバランス','自分のペースで心地よい調和を。'],directing:['あなたが今日に働きかける','小さな選択に、あなたらしさを。']},
    elements:{wood:['木','木','成長','身のまわりの小さな変化に目を向けて。'],fire:['火','火','表現','心が動くものをひとつ見つけて。'],earth:['土','土','安定','ゆっくりと心を落ち着ける時間を。'],metal:['金','金','明晰','気になるものひとつに意識を向けて。'],water:['水','水','ひらめき','静かな時間から新しい発想のきっかけを。']},
  }
};
copy.en.ui = {
 headerCaption:'A little direction for your day', issue:'A LITTLE DAILY RITUAL', edition:'INSPIRED BY THE FIVE ELEMENTS', progressOne:'Your element', progressTwo:'Your place', progressThree:'Your moment', eyebrowOne:'A SMALL RITUAL FOR YOUR DAY', heroTitleOne:'A little more', heroTitleTwo:'flow', heroTitleThree:'in your day.', heroLede:'An ancient idea, a new way to explore. Discover how your element meets today’s, and find a little adventure made for you.', noteTitle:'THE FIVE ELEMENTS', noteBody:'Wood, fire, earth, metal and water. A different lens for the everyday.', panelKicker:'LET’S BEGIN', birthdayTitle:'It starts with you.', birthdayDesc:'Your birthday reveals your day-stem element.', birthdayLabel:'YOUR DATE OF BIRTH', analyze:'Discover my element', birthHint:'Your date stays on this device.', demo:'Try an example ↗', yourReading:'YOUR READING', analysisFoot:'A moment to pause. A new way to see your day.', toPlace:'Choose your place', eyebrowTwo:'LET’S GO SOMEWHERE', placeTitleOne:'Where to', placeTitleTwo:'today?', placeLede:'For this preview, try Shinjuku, Shibuya or Asakusa. Say it out loud or write it down.', placeKicker:'YOUR NEXT LITTLE ADVENTURE', placeInputTitle:'Start with a place.', placeInputDesc:'Tell us where you’d like to explore.', placeLabel:'YOUR DESTINATION', placePlaceholder:'e.g. Shinjuku', back:'Back', findPlace:'Find my experience', eyebrowThree:'A LITTLE SOMETHING FOR YOU', resultTitleOne:'Make a little', resultTitleTwo:'space.', resultLede:'A place, a moment, and a little inspiration for your day.', changePlace:'Change place', startAgain:'Start again ↗', footerNote:'An invitation to pause, notice, and explore.', footerCulture:'INSPIRED BY THE FIVE ELEMENTS · MADE FOR CURIOSITY'
};
copy.ja.ui = {
 headerCaption:'今日を少し心地よく', issue:'毎日の小さな習慣', edition:'五行から生まれたアイデア', progressOne:'あなたの五行', progressTwo:'行きたい場所', progressThree:'今日の体験', eyebrowOne:'今日を彩る、小さな習慣', heroTitleOne:'今日に、', heroTitleTwo:'心地よい', heroTitleThree:'めぐりを。', heroLede:'古くからの五行の考え方を、今日の小さな冒険に。あなたと今日の五行が出会うとき、どんな体験が待っているでしょう。', noteTitle:'五行とは', noteBody:'木・火・土・金・水。いつもの一日を、少し違う視点から。', panelKicker:'はじめましょう', birthdayTitle:'まずは、あなたから。', birthdayDesc:'生年月日から日主の五行を見つけます。', birthdayLabel:'生年月日', analyze:'五行を見てみる', birthHint:'生年月日はこの端末内で処理されます。', demo:'サンプルで試す ↗', yourReading:'あなたと今日の五行', analysisFoot:'立ち止まって、今日を新しい視点で。', toPlace:'行きたい場所を選ぶ', eyebrowTwo:'どこへ出かけよう', placeTitleOne:'今日は、', placeTitleTwo:'どこへ？', placeLede:'プレビューでは新宿・渋谷・浅草をお試しいただけます。話すか、文字で入力してください。', placeKicker:'小さな冒険のはじまり', placeInputTitle:'場所を教えてください。', placeInputDesc:'今日、散策したいエリアはどこですか？', placeLabel:'行きたい場所', placePlaceholder:'例：新宿', back:'戻る', findPlace:'体験を見つける', eyebrowThree:'あなたへの小さな贈りもの', resultTitleOne:'今日の', resultTitleTwo:'ひととき。', resultLede:'場所と体験、そして今日を彩る小さなヒント。', changePlace:'場所を変更', startAgain:'はじめから ↗', footerNote:'立ち止まり、気づき、出かけよう。', footerCulture:'五行にインスパイアされた小さな体験'
};
Object.assign(copy.en, {
  loading:'Searching for a real place and preparing your experience…',
  liveLabel:'LIVE SEARCH · AI SUGGESTION', liveSource:'Source',
  liveFailure:'Live search is unavailable right now. Please try again.',
  noVenue:'No suitable visitor destination was found. Try a more specific neighborhood or place.',
  fallbackNotice:'Live search is unavailable. Showing a curated example instead.',
  fallbackNoVenue:'Live search could not verify a suitable place. Showing a curated example instead.',
  translationLoading:'Translating this recommendation…',
  languageFailure:'Translation is unavailable. Showing the original recommendation.',
  mapTitle:'Explore the area', mapCaption:'Location on Google Maps',
  tooLong:'Please keep the destination under 120 characters.'
});
Object.assign(copy.ja, {
  loading:'実在する場所を探して、あなたの体験を考えています…',
  liveLabel:'ライブ検索 · AIによる提案', liveSource:'情報源',
  liveFailure:'現在ライブ検索を利用できません。もう一度お試しください。',
  noVenue:'訪問できる場所が見つかりませんでした。より具体的な地域や場所を入力してください。',
  fallbackNotice:'ライブ検索を利用できないため、サンプルを表示しています。',
  fallbackNoVenue:'条件に合う場所を確認できなかったため、サンプルを表示しています。',
  translationLoading:'このおすすめを翻訳しています…',
  languageFailure:'翻訳を利用できないため、元の言語で表示しています。',
  mapTitle:'場所を見てみよう', mapCaption:'Google マップで場所を確認',
  tooLong:'行きたい場所は120文字以内で入力してください。'
});
copy.en.ui.placeLede = 'A neighborhood, a city, or a place you’ve been curious about. Say it out loud or write it down.';
copy.ja.ui.placeLede = '行ってみたい街や場所を、話すか文字で入力してください。';
const places = [
  { keys:['shinjuku','新宿'], name:{en:'Shinjuku Gyoen National Garden',ja:'新宿御苑・日本庭園'}, area:{en:'SHINJUKU, TOKYO',ja:'東京・新宿'}, source:'https://policies.env.go.jp/national-garden/shinjukugyoen/guide/information/index.html', maps:'Shinjuku Gyoen National Garden',
    activities:{en:{wood:'Wander through the Japanese Garden and photograph one plant or detail that catches your eye.',fire:'Stroll the garden and capture a scene that inspires you; give your photo a title.',earth:'Take a gentle walk through the Japanese Garden, then pause to notice the view.',metal:'Explore the garden slowly and choose one detail of its landscape to sketch or photograph.',water:'Walk slowly through the Japanese Garden and save a photo or a sentence about a view you love.'},ja:{wood:'日本庭園を散策し、気になった植物や風景を一枚撮ってみましょう。',fire:'庭園を歩き、心が動いた景色を撮影。写真にタイトルをつけてみましょう。',earth:'日本庭園をゆっくり歩き、好きな景色の前で少し立ち止まってみましょう。',metal:'庭園を歩きながら、気になる風景の細部をひとつ撮影してみましょう。',water:'日本庭園をゆっくり歩き、好きな景色を写真や一言に残してみましょう。'}} },
  { keys:['shibuya','渋谷','yoyogi','代々木','harajuku','原宿'], name:{en:'Yoyogi Park',ja:'代々木公園'}, area:{en:'SHIBUYA, TOKYO',ja:'東京・渋谷'}, source:'https://www.gotokyo.org/en/spot/21/', maps:'Yoyogi Park Tokyo',
    activities:{en:{wood:'Take a slow walk through the park and notice the trees changing with the season.',fire:'Walk through the park and photograph a lively color or scene that inspires you.',earth:'Choose a comfortable spot in the park and pause for a few unhurried breaths.',metal:'Walk through the park and observe one interesting shape or pattern in your surroundings.',water:'Take a gentle walk through the park and note one thought that comes to mind.'},ja:{wood:'公園をゆっくり歩き、季節とともに変わる木々に目を向けてみましょう。',fire:'公園を歩き、気持ちが明るくなる色や景色を一枚撮ってみましょう。',earth:'公園で心地よい場所を見つけ、ゆっくりと深呼吸してみましょう。',metal:'公園を歩きながら、気になる形や模様をひとつ探してみましょう。',water:'公園をゆっくり散歩し、浮かんだことをひとつメモしてみましょう。'}} },
  { keys:['asakusa','浅草'], name:{en:'Asakusa & Nakamise Street',ja:'浅草・仲見世通り'}, area:{en:'ASAKUSA, TOKYO',ja:'東京・浅草'}, source:'https://www.gotokyo.org/en/destinations/eastern-tokyo/asakusa/index.html', maps:'Nakamise Shopping Street Asakusa',
    activities:{en:{wood:'Stroll along Nakamise and notice a traditional craft or detail you have never seen before.',fire:'Explore Nakamise and photograph a color or design that sparks your curiosity.',earth:'Walk at your own pace through Asakusa and take a moment to notice the historic streets.',metal:'Look closely at the signs and traditional designs along Nakamise; choose a favorite.',water:'Wander through Asakusa and capture one scene that makes you curious about its story.'},ja:{wood:'仲見世を歩き、初めて気づいた伝統的な品や風景を探してみましょう。',fire:'仲見世で心が動く色やデザインを見つけ、写真に残してみましょう。',earth:'浅草の街を自分のペースで歩き、歴史ある風景をゆっくり眺めましょう。',metal:'仲見世の看板や伝統的なデザインを観察し、お気に入りを選んでみましょう。',water:'浅草を歩き、物語を感じる風景を一枚撮ってみましょう。'}} }
];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = () => copy[state.lang];
function formatDate(date) { return new Intl.DateTimeFormat(state.lang === 'ja' ? 'ja-JP' : 'en-US', {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`)); }
function setStep(number) {
  if(number !== 2) voice?.stop();
  state.step = number;
  for (let i=1; i<=3; i++) { const el=$(`step-${i}`); if(el) el.hidden = i !== number; }
  document.querySelectorAll('[data-step-indicator]').forEach(el => { const n=Number(el.dataset.stepIndicator); el.classList.toggle('active', n===number); el.classList.toggle('complete', n<number); if(n===number) el.setAttribute('aria-current','step'); else el.removeAttribute('aria-current'); });
  window.scrollTo({top:0,behavior:'smooth'});
}
function updateLanguage() {
  document.documentElement.lang = state.lang;
  voice?.refresh();
  window.gogyoLoading.setLanguage(state.lang);
  document.querySelectorAll('[data-i18n]').forEach(el => { const text = copy[state.lang].ui?.[el.dataset.i18n]; if(text !== undefined) el.textContent=text; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const text=copy[state.lang].ui?.[el.dataset.i18nPlaceholder]; if(text !== undefined) el.placeholder=text; });
  const toggle=$('lang-toggle'); if(toggle) { toggle.textContent=state.lang === 'en' ? '日本語' : 'EN'; toggle.setAttribute('aria-label',state.lang === 'en'?'Switch to Japanese':'英語に切り替え'); }
  if(state.person) renderAnalysis();
  if(state.place?.kind === 'live') {
    if(state.liveResults[state.lang]) renderResult();
    else if(state.step === 3) translateResult();
  } else if(state.place) renderResult();
}
function renderAnalysis() {
  const d=t(), person=state.person, today=state.today, pe=d.elements[person.element], de=d.elements[today.element], rel=d.relations[state.relation];
  $('analysis-content').innerHTML=`<div class="reading-pair"><div class="reading-item"><span class="reading-label">${d.yourElement}</span><div class="element-orb element-${person.element}">${pe[0]}</div><strong>${pe[1]}</strong><small>${d.dayMaster} ${person.stem} · ${d.dayPillar} ${person.dayPillar}</small></div><span class="reading-times">×</span><div class="reading-item"><span class="reading-label">${d.todayElement}</span><div class="element-orb element-${today.element}">${de[0]}</div><strong>${de[1]}</strong><small>${d.todayStem} ${today.stem} · ${d.dayPillar} ${today.dayPillar}</small></div></div><div class="relationship"><span class="eyebrow">${d.relationLabel}</span><h3>${rel[0]}</h3><p>${rel[1]}</p><p class="reading-date">${formatDate(today.date)} · ${d.jst}</p></div><div class="reading-note">${d.dateNote}</div>`;
}
function mapEmbed(query) {
  const d=t(), encoded=encodeURIComponent(query);
  return `<div class="result-map"><div class="result-map-heading"><span class="eyebrow">${d.mapTitle}</span><span class="map-caption">${d.mapCaption}</span></div><iframe title="${d.mapCaption}" src="https://maps.google.com/maps?q=${encoded}&amp;output=embed&amp;hl=${state.lang}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
}
function renderResult() {
  if(state.place?.kind === 'live') return renderLiveResult(state.liveResults[state.lang]);
  const d=t(), p=state.place, e=d.elements[state.today.element], personal=d.elements[state.person.element], rel=d.relations[state.relation], action=p.activities[state.lang][state.today.element];
  $('result-content').innerHTML=`<div class="result-inner"><div class="result-top"><span class="eyebrow">${d.resultLabel}</span><span class="demo-badge">${d.demoLabel}</span></div>${p.isFallback ? `<p class="reading-note">${p.fallbackCause === 'no_visitor_venue' ? d.fallbackNoVenue : d.fallbackNotice}</p>` : ''}<div class="result-title-row"><div><span class="result-area">${p.area[state.lang]}</span><h2>${p.name[state.lang]}</h2></div><div class="result-stamp">${e[0]}</div></div>${mapEmbed(p.maps)}<div class="result-divider"></div><div class="result-grid"><div class="result-block"><span class="eyebrow">01 / ${d.actionLabel}</span><p>${action}</p></div><div class="result-block"><span class="eyebrow">02 / ${d.luckLabel}</span><h3>${e[2]}</h3><p>${e[3]}</p></div><div class="result-block wide"><span class="eyebrow">03 / ${d.reasonLabel}</span><p>${personal[0]} × ${e[0]} · ${rel[0]}. ${rel[1]} ${d.reason}</p></div></div><div class="result-footer"><a href="${p.source}" target="_blank" rel="noopener noreferrer">${d.source}</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.maps)}" target="_blank" rel="noopener noreferrer">${d.map}</a></div><p class="reading-note">${d.checkHours}</p></div>`;
}
function renderLiveResult(result, warning = '') {
  const d=t(), e=d.elements[state.today.element], personal=d.elements[state.person.element], rel=d.relations[state.relation];
  if(!result) { $('result-content').textContent=d.loading; return; }
  const url=safeSourceUrl(result.sourceUrl);
  $('result-content').innerHTML=`<div class="result-inner"><div class="result-top"><span class="eyebrow">${d.resultLabel}</span><span class="demo-badge">${d.liveLabel}</span></div>${warning ? `<p class="reading-note" role="status">${esc(warning)}</p>` : ''}<div class="result-title-row"><div><span class="result-area">${esc(result.area)}</span><h2>${esc(result.placeName)}</h2></div><div class="result-stamp">${e[0]}</div></div>${mapEmbed(result.placeName + ' ' + result.area)}<div class="result-divider"></div><div class="result-grid"><div class="result-block"><span class="eyebrow">01 / ${d.actionLabel}</span><p>${esc(result.activity)}</p></div><div class="result-block"><span class="eyebrow">02 / ${d.luckLabel}</span><h3>${esc(result.luckTheme)}</h3><p>${esc(result.luckDescription)}</p></div><div class="result-block wide"><span class="eyebrow">03 / ${d.reasonLabel}</span><p>${personal[0]} × ${e[0]} · ${rel[0]}. ${esc(result.reason)}</p></div></div><div class="result-footer"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${d.liveSource}: ${esc(result.sourceTitle || result.placeName)} ↗</a><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.placeName + ' ' + result.area)}" target="_blank" rel="noopener noreferrer">${d.map}</a></div><p class="reading-note">${d.checkHours}</p></div>`;
}
function safeSourceUrl(value) {
  try { const url=new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
}
function validResult(result) {
  return result && ['placeName','area','activity','luckTheme','luckDescription','reason','sourceUrl'].every(key=>typeof result[key] === 'string' && result[key].trim() && result[key].length <= 2000) && !!safeSourceUrl(result.sourceUrl);
}
function analyze() {
  const value=$('birthday').value;
  try {
    if(!value || value > getJapanToday()) throw Error();
    state.person=getDayProfile(value); state.today=getDayProfile(getJapanToday()); state.relation=getElementRelation(state.person.element,state.today.element); state.place=null;
    $('analysis').hidden=false; $('birthday').setCustomValidity(''); renderAnalysis(); $('analysis').scrollIntoView({behavior:'smooth',block:'nearest'});
  } catch { $('birthday').setCustomValidity(t().needBirthday); $('birthday').reportValidity(); }
}
async function findPlace() {
  const value=$('place').value.trim();
  if(!value) { $('place-error').textContent=t().needPlace; return; }
  if(value.length > 120) { $('place-error').textContent=t().tooLong; return; }
  await loadRecommendation(value);
}
async function loadRecommendation(query) {
  state.controller?.abort();
  const requestId=++state.requestId, language=state.lang;
  const button=$('find-place'); button.disabled=true; button.setAttribute('aria-busy','true');
  $('place-error').textContent=''; $('voice-status').textContent=t().loading;
  voice?.stop();
  window.gogyoLoading.start({language:state.lang});
  const controller=new AbortController();
  state.controller=controller;
  const timer=setTimeout(()=>controller.abort(), 120000);
  try {
    const response=await fetch('/api/recommend', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({place:query,language,personElement:state.person.element,todayElement:state.today.element,relation:state.relation}),signal:controller.signal});
    if(!response.ok) {
      const failure=await response.json().catch(()=>({}));
      throw new Error(failure.error === 'no_visitor_venue' ? 'no_visitor_venue' : 'Recommendation unavailable');
    }
    const result=await response.json();
    if(!validResult(result)) throw new Error('Invalid recommendation');
    if(requestId !== state.requestId) return;
    state.liveResults={};
    state.place={kind:'live',query}; state.liveResults[language]=result;
    setStep(3);
    if(language === state.lang) renderResult();
    else { button.disabled=false; button.removeAttribute('aria-busy'); $('voice-status').textContent=''; translateResult(); }
  } catch (error) {
    if(requestId !== state.requestId) return;
    const lower=query.toLowerCase(), fallback=places.find(p=>p.keys.some(key=>lower === key.toLowerCase()));
    if(fallback) { state.place={...fallback,isFallback:true,fallbackCause:error.message}; state.liveResults={}; renderResult(); setStep(3); }
    else $('place-error').textContent=error.message === 'no_visitor_venue' ? t().noVenue : t().liveFailure;
  } finally {
    clearTimeout(timer);
    if(requestId === state.requestId) { state.controller=null; button.disabled=false; button.removeAttribute('aria-busy'); $('voice-status').textContent=''; window.gogyoLoading.stop(); }
  }
}
async function translateResult() {
  const source=state.liveResults[state.lang === 'en' ? 'ja' : 'en'];
  if(!source) return;
  state.controller?.abort();
  const requestId=++state.requestId, language=state.lang;
  const controller=new AbortController(); state.controller=controller;
  renderLiveResult(source, t().translationLoading);
  const timer=setTimeout(()=>controller.abort(), 120000);
  try {
    const response=await fetch('/api/translate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language,result:source}),signal:controller.signal});
    if(!response.ok) throw new Error('Translation unavailable');
    const result=await response.json();
    if(!validResult(result) || result.sourceUrl !== source.sourceUrl) throw new Error('Invalid translation');
    if(requestId !== state.requestId) return;
    state.liveResults[language]={...result,sourceUrl:source.sourceUrl,sourceTitle:source.sourceTitle};
    if(language === state.lang) renderResult();
  } catch {
    if(requestId === state.requestId && language === state.lang) renderLiveResult(source, t().languageFailure);
  } finally {
    clearTimeout(timer);
    if(requestId === state.requestId) state.controller=null;
  }
}
voice=setupVoice({input:$('place'),button:$('mic'),status:$('voice-status'),getLanguage:()=>state.lang});
document.addEventListener('gogyo:cancel-search',()=>{
  state.requestId++;
  state.controller?.abort();
  state.controller=null;
  $('find-place').disabled=false;
  $('find-place').removeAttribute('aria-busy');
  $('voice-status').textContent='';
  window.gogyoLoading.stop();
});
$('birthday').max=getJapanToday();
$('birthday').addEventListener('input',()=>{$('birthday').setCustomValidity(''); if(state.person) {state.person=null; $('analysis').hidden=true;}});
$('analyze').addEventListener('click',analyze);
$('demo').addEventListener('click',()=>{ $('birthday').value='2001-03-30'; analyze(); });
$('to-place').addEventListener('click',()=>{ if(state.person) setStep(2); });
$('back-one').addEventListener('click',()=>{state.requestId++;state.controller?.abort();state.controller=null;$('find-place').disabled=false;$('find-place').removeAttribute('aria-busy');$('voice-status').textContent='';setStep(1);});
$('back-two').addEventListener('click',()=>{state.requestId++;state.controller?.abort();state.controller=null;$('find-place').disabled=false;$('find-place').removeAttribute('aria-busy');$('voice-status').textContent='';setStep(2);});
$('find-place').addEventListener('click',findPlace);
$('place').addEventListener('keydown',event=>{if(event.key==='Enter')findPlace();});
$('place').addEventListener('input',()=>{$('place-error').textContent='';});
$('restart').addEventListener('click',()=>{state.requestId++;state.controller?.abort();state.controller=null;state.person=null;state.place=null;state.liveResults={};$('find-place').disabled=false;$('find-place').removeAttribute('aria-busy');$('birthday').value='';$('place').value='';$('analysis').hidden=true;$('place-error').textContent='';$('voice-status').textContent='';setStep(1);});
$('lang-toggle').addEventListener('click',()=>{state.lang=state.lang==='en'?'ja':'en';updateLanguage();});
updateLanguage();setStep(1);
