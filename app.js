const modeSelect = document.getElementById('modeSelect');
const surahSelect = document.getElementById('surahSelect');
const ayahList = document.getElementById('ayahList');
const audioPlayer = document.getElementById('audioPlayer');

let data = []; // JSON كامل
let mode = 'reading';
let clickState = {}; // حالة النقر لكل آية

// تغيير الوضعية
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  clickState = {};
});

// جلب JSON
fetch('quran.json')
  .then(res => res.json())
  .then(jsonData => {
    data = jsonData;

    // ملء قائمة السور
    const surahNumbers = [...new Set(data.map(a => a.surah_number))];
    surahNumbers.forEach(num => {
      const surahName = data.find(a => a.surah_number == num).surah_name;
      let option = document.createElement('option');
      option.value = num;
      option.textContent = surahName;
      surahSelect.appendChild(option);
    });
  });

// عند اختيار السورة
surahSelect.addEventListener('change', () => {
  const surahNum = surahSelect.value;
  if(!surahNum) return;

  const surahAyahs = data.filter(a => a.surah_number == surahNum);
  ayahList.innerHTML = '';

  surahAyahs.forEach(ayah => {
    const li = document.createElement('li');
    li.dataset.index = ayah.ayah_number;
    li.dataset.text = ayah.ayah_text;

    // تعديل المسار ليوافق audio/001001.mp3
    li.dataset.audio = `audio/${String(ayah.surah_number).padStart(3,'0')}${String(ayah.ayah_number).padStart(3,'0')}.mp3`;

    li.innerHTML = `<span class="hint"></span> ${ayah.ayah_text}`;
    ayahList.appendChild(li);
  });

  setupAyahClicks();
});

// إعداد النقرات على الآيات
function setupAyahClicks(){
  ayahList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const index = li.dataset.index;
      const text = li.dataset.text;
      const audioSrc = li.dataset.audio;

      if(mode === 'reading'){
        // وضع القراءة: تشغيل الصوت + الانتقال التلقائي
        audioPlayer.src = audioSrc;
        audioPlayer.play();
        ayahList.querySelectorAll('li').forEach(s => s.classList.remove('highlighted'));
        li.classList.add('highlighted');

        audioPlayer.onended = () => {
          const next = li.nextElementSibling;
          if(next) next.click();
        };

      } else {
        // وضع التسميع (Quiz)
        if(!clickState[index]) clickState[index]=1;
        else clickState[index]++;

        if(clickState[index]===1){
          li.querySelector('.hint').textContent = text.split(' ')[0]; // أول كلمة
        } else if(clickState[index]===2){
          li.querySelector('.hint').textContent = text; // كامل النص
        } else if(clickState[index]===3){
          audioPlayer.src = audioSrc;
          audioPlayer.play();
          ayahList.querySelectorAll('li').forEach(s => s.classList.remove('highlighted'));
          li.classList.add('highlighted');
          clickState[index]=0;
        }
      }
    });
  });
}

// تسجيل Service Worker للأوفلاين
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW registration failed:', err));
}

