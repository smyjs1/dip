// Browser speech recognition is optional. Text input always remains available.
// setupVoice only creates controls; the microphone is requested on an explicit click.
const MESSAGES = {
  en: {
    label:'Voice language', start:'Start voice input', stop:'Stop listening',
    starting:'Waiting for microphone permission… Allow access if your browser asks.',
    listening:'Listening… say a destination, then pause. Tap the microphone again to stop.',
    done:'Heard you. You can edit the text before searching.',
    stopped:'Stopped listening. You can type your destination instead.',
    unsupported:'Voice input is unavailable in this browser. Try Chrome or type your destination.',
    insecure:'Voice input requires a secure connection. Use HTTPS or type your destination.',
    'not-allowed':'Microphone or speech access was denied. Check browser permissions, try Chrome, or type your destination.',
    'service-not-allowed':'This browser cannot use its speech service here. Try Chrome or type your destination.',
    'audio-capture':'No microphone was detected. Check your device settings or type your destination.',
    'no-speech':'No speech was detected. Try again in a quieter place or type your destination.',
    network:'Speech recognition needs a network connection. Check your connection or type your destination.',
    'language-not-supported':'This speech language is unavailable in your browser. Select another language or type.',
    generic:'Voice recognition could not start. Try Chrome or type your destination.',
    timeout:'Voice recognition did not start. Check microphone permission or try Chrome.',
    privacy:'Your browser may send audio to its speech recognition service.'
  },
  ja: {
    label:'音声の言語', start:'音声入力を開始', stop:'音声入力を停止',
    starting:'マイクの許可を待っています。ブラウザで確認が表示されたら許可してください。',
    listening:'聞いています。行きたい場所を話し、少しお待ちください。もう一度押すと停止します。',
    done:'認識しました。検索する前に文字を修正できます。',
    stopped:'音声入力を停止しました。文字で入力することもできます。',
    unsupported:'このブラウザでは音声入力を利用できません。Chrome を使うか、文字で入力してください。',
    insecure:'音声入力には安全な接続が必要です。HTTPS で開くか、文字で入力してください。',
    'not-allowed':'マイクまたは音声認識が許可されていません。ブラウザの設定を確認するか、Chrome または文字入力をお試しください。',
    'service-not-allowed':'このブラウザでは音声認識サービスを利用できません。Chrome を使うか、文字で入力してください。',
    'audio-capture':'マイクが見つかりません。端末の設定を確認するか、文字で入力してください。',
    'no-speech':'音声を聞き取れませんでした。静かな場所でもう一度話すか、文字で入力してください。',
    network:'音声認識にはインターネット接続が必要です。接続を確認するか、文字で入力してください。',
    'language-not-supported':'このブラウザでは選択した音声言語を利用できません。他の言語を選ぶか、文字で入力してください。',
    generic:'音声認識を開始できませんでした。Chrome を使うか、文字で入力してください。',
    timeout:'音声認識を開始できませんでした。マイクの許可を確認するか、Chrome をお試しください。',
    privacy:'音声は、ブラウザの音声認識サービスへ送信される場合があります。'
  }
};

/**
 * Install voice controls without requesting microphone permission.
 * getLanguage returns the current UI language ('en' or 'ja').
 * Return value exposes refresh() after a UI language switch and stop() when leaving the page.
 */
export function setupVoice({input, button, status, getLanguage}) {
  const language = () => getLanguage() === 'ja' ? 'ja' : 'en';
  let recognition = null, active = false, lastStatus = '', hasResult = false, stoppedByUser = false, userChoseLanguage = false, startTimer = null;
  const row = document.createElement('div');
  row.className = 'voice-options';
  Object.assign(row.style, {display:'flex', alignItems:'center', gap:'8px', marginTop:'10px', color:'#718075', fontSize:'11px'});
  const label = document.createElement('label');
  label.htmlFor = 'voice-language';
  Object.assign(label.style, {display:'inline', margin:'0', color:'inherit', fontSize:'11px', letterSpacing:'normal', fontWeight:'500'});
  const select = document.createElement('select');
  select.id = 'voice-language';
  Object.assign(select.style, {font:'inherit', color:'#344f43', background:'transparent', border:'1px solid #d8ddd3', borderRadius:'0', padding:'4px 7px', maxWidth:'45%'});
  for (const [value, name] of [['en-US','English'],['ja-JP','日本語'],['zh-CN','中文']]) {
    const option=document.createElement('option'); option.value=value; option.textContent=name; select.appendChild(option);
  }
  select.value = language() === 'ja' ? 'ja-JP' : 'en-US';
  select.addEventListener('change', () => { userChoseLanguage=true; });
  row.append(label, select);
  status.before(row);
  const privacy = document.createElement('div');
  privacy.className='voice-privacy';
  Object.assign(privacy.style,{fontSize:'10px',lineHeight:'1.5',color:'#8a9588',marginTop:'6px'});
  status.after(privacy);

  function refresh() {
    const messages = MESSAGES[language()];
    label.textContent=messages.label;
    privacy.textContent=messages.privacy;
    button.setAttribute('aria-label', active ? messages.stop : messages.start);
    button.setAttribute('title', active ? messages.stop : messages.start);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (lastStatus) status.textContent=messages[lastStatus] || messages.generic;
    if (!userChoseLanguage && !active) select.value=language()==='ja'?'ja-JP':'en-US';
  }
  function show(key) {lastStatus=key; refresh();}
  function setActive(value) { active=value; button.classList.toggle('listening',value); select.disabled=value; refresh(); }
  function stop() {
    if (!recognition) return;
    clearTimeout(startTimer); startTimer=null;
    stoppedByUser=true;
    try { recognition.stop(); } catch { /* The recognition session may already be ending. */ }
  }
  function onClick() {
    if (active || recognition) { stop(); return; }
    const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { show('unsupported'); return; }
    if (window.isSecureContext === false) { show('insecure'); return; }
    try {
      const session=new SpeechRecognition();
      recognition=session; hasResult=false; stoppedByUser=false;
      session.lang=select.value; session.interimResults=false; session.maxAlternatives=1; session.continuous=false;
      session.onstart=()=>{if(recognition===session){clearTimeout(startTimer);startTimer=null;setActive(true);show('listening');}};
      session.onresult=event=>{
        if(recognition!==session) return;
        const transcript=event.results?.[0]?.[0]?.transcript?.trim();
        if (!transcript) {show('no-speech'); return;}
        input.value=transcript; input.dispatchEvent(new Event('input',{bubbles:true}));
        hasResult=true; show('done');
      };
      session.onerror=event=>{
        if(recognition!==session) return;
        clearTimeout(startTimer); startTimer=null;
        if (event.error==='aborted' && stoppedByUser) {show('stopped'); return;}
        const known=['not-allowed','service-not-allowed','audio-capture','no-speech','network','language-not-supported'];
        show(known.includes(event.error) ? event.error : 'generic');
      };
      session.onend=()=>{
        if(recognition!==session) return;
        clearTimeout(startTimer); startTimer=null;
        recognition=null; setActive(false);
        if (!hasResult && lastStatus==='listening') show(stoppedByUser ? 'stopped' : 'no-speech');
      };
      setActive(true);
      show('starting');
      session.start();
      startTimer=setTimeout(()=>{
        if(recognition!==session || lastStatus!=='starting') return;
        try { session.abort(); } catch { /* Session may have ended already. */ }
        recognition=null; setActive(false); show('timeout');
      },20000);
    } catch {
      clearTimeout(startTimer); startTimer=null;
      recognition=null; setActive(false); show('generic');
    }
  }
  button.addEventListener('click',onClick);
  refresh();
  return {refresh,stop,destroy(){stop();button.removeEventListener('click',onClick);row.remove();privacy.remove();}};
}
