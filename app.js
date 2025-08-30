// app.js

const modeSelect = document.getElementById('modeSelect');
const surahSelect = document.getElementById('surahSelect');
const ayahList = document.getElementById('ayahList');
const audioPlayer = document.getElementById('audioPlayer');

let data = [];
let mode = 'reading';
let clickState = {};

// تغيير الوضعية
modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  clickState = {};
});

// CSV parser
function parseCSV(text) {
  const lines = text.split("\n").filter(l => l.trim() !== "");
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : "");
    return {
      surah_name: obj["اسم السورة"],
      surah_number: obj["رقم السورة"],
      ayah_number: obj["رقم الاية"],
      ayah_text: obj["نص الاية"]
    };
  });
}

// Auto-load CSV from root
fetch('quran.csv')
  .then(res => res.text())
  .then(text => {
    data = parseCSV(text);

    // Populate Surah dropdown
    const surahNumbers = [...new Set(data.map(a => a.surah_number))];
    surahSelect.innerHTML = '<option value="">اختر السورة</option>';
    surahNumbers.forEach(num => {
      const surahName = data.find(a => a.surah_number == num).surah_name;
      const option = document.createElement('option');
      option.value = num;
      option.textContent = surahName;
      surahSelect.appendChild(option);
    });
  })
  .catch(err => console.error("Failed to load CSV:", err));

// Display ayahs when surah selected
surahSelect.addEventListener('change', () => {
  const surahNum = surahSelect.value;
  if (!surahNum) return;

  const surahAyahs = data.filter(a => a.surah_number == surahNum);
  ayahList.innerHTML = '';

  surahAyahs.forEach(ayah => {
    const li = document.createElement('li');
    li.dataset.index = ayah.ayah_number;
    li.dataset.text = ayah.ayah_text;
    li.dataset.audio = `audio/${String(ayah.surah_number).padStart(3,'0')}${String(ayah.ayah_number).padStart(3,'0')}.mp3`;
    li.innerHTML = `<span class="hint"></span> ${ayah.ayah_text}`;
    ayahList.appendChild(li);
  });

  setupAyahClicks();
});

// Setup clicks on ayahs
function setupAyahClicks() {
  ayahList.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const index = li.dataset.index;
      const text = li.dataset.text;
      const audioSrc = li.dataset.audio;

      if(mode === 'reading'){
        audioPlayer.src = audioSrc;
        audioPlayer.play();
        ayahList.querySelectorAll('li').forEach(s => s.classList.remove('highlighted'));
        li.classList.add('highlighted');

        audioPlayer.onended = () => {
          const next = li.nextElementSibling;
          if(next) next.click();
        };
      } else {
        if(!clickState[index]) clickState[index]=1;
        else clickState[index]++;

        if(clickState[index]===1){
          li.querySelector('.hint').textContent = text.split(' ')[0];
        } else if(clickState[index]===2){
          li.querySelector('.hint').textContent = text;
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

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.log('SW registration failed:', err));
}

