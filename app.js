// =============================================
// 1. 데이터 저장소
// =============================================

// 단어 목록을 담는 배열. 객체(영단어+뜻) 형태로 쌓임
// 예: [ {english:"apple", korean:"사과"}, ... ]
// 페이지 로드 시 localStorage에서 불러옴. 없을 시 빈배열로 시작
let wordList = JSON.parse(localStorage.getItem('vocab-words')) || [];

// 현재 퀴즈에서 각 행이 무엇을 문제로 출제했는지 기록
// 예: [ {show:"english", answer:"korean"}, ... ]
let quizConfig = [];


// =============================================
// 2. HTML 요소 가져오기
// =============================================

// getElementById — id 이름표로 HTML 요소를 JS로 불러옴
const inputEnglish  = document.getElementById('input-english');
const inputKorean   = document.getElementById('input-korean');
const btnAdd        = document.getElementById('btn-add');
const wordListEl    = document.getElementById('word-list');
const btnStart      = document.getElementById('btn-start');

const inputSection  = document.getElementById('input-section');
const quizSection   = document.getElementById('quiz-section');
const quizRowsEl    = document.getElementById('quiz-rows');
const btnCheck      = document.getElementById('btn-check');
const btnRetry      = document.getElementById('btn-retry');
const btnBack       = document.getElementById('btn-back');


// =============================================
// 3. 단어 추가
// =============================================

btnAdd.addEventListener('click', function() {

  // 입력값을 가져오고 앞뒤 공백 제거 (trim)
  const eng = inputEnglish.value.trim();
  const kor = inputKorean.value.trim();

  // 둘 중 하나라도 비어있으면 중단
  if (eng === '' || kor === '') {
    alert('영단어와 뜻을 모두 입력해주세요.');
    return; // 함수 즉시 종료
  }

  // 배열에 객체 형태로 추가
  wordList.push({ english: eng, korean: kor });

  // 화면 목록 다시 그리기
  renderWordList();

  // 입력칸 비우기
  inputEnglish.value = '';
  inputKorean.value = '';
  inputEnglish.focus(); // 커서를 다시 영단어칸으로
});


// Enter 키로도 추가 가능하게
inputKorean.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') btnAdd.click();
});


// =============================================
// 4. 단어 목록 화면에 그리기
// =============================================

function renderWordList() {
   //단어 목록이 바뀔때마다 저장
   localStorage.setItem('vocab-words', JSON.stringify(wordList));

  // 기존 목록 초기화
  wordListEl.innerHTML = '';

  // wordList 배열을 순서대로 순회
  wordList.forEach(function(word, index) {

    // li 요소 생성
    const li = document.createElement('li');

    // li 안에 텍스트와 삭제버튼 HTML 삽입
    // index는 나중에 삭제 시 어떤 단어인지 찾기 위한 번호
    li.innerHTML = `
      <span>${word.english} — ${word.korean}</span>
      <button class="delete-btn" data-index="${index}">✕</button>
    `;

    wordListEl.appendChild(li); // ul 안에 li 추가
  });
}


// =============================================
// 5. 단어 삭제
// =============================================

// 삭제 버튼은 동적으로 생성되므로 부모(wordListEl)에 이벤트를 걺
// 이것을 "이벤트 위임(Event Delegation)"이라고 함
wordListEl.addEventListener('click', function(e) {

  // 클릭된 요소가 delete-btn 클래스인지 확인
  if (e.target.classList.contains('delete-btn')) {

    // data-index 속성에서 번호를 읽어옴
    const index = parseInt(e.target.dataset.index);

    // 배열에서 해당 인덱스 1개 제거
    wordList.splice(index, 1);

    // 화면 다시 그리기
    renderWordList();
  }
});


// =============================================
// 6. 학습 시작 — 퀴즈 화면 생성
// =============================================

btnStart.addEventListener('click', function() {

  if (wordList.length === 0) {
    alert('단어를 먼저 추가해주세요.');
    return;
  }

  // 퀴즈 행 생성
  buildQuizRows();

  // 화면 전환: input-section 숨기고 quiz-section 보이기
  // classList.add/remove로 hidden 클래스를 붙였다 뗌
  inputSection.classList.add('hidden');
  quizSection.classList.remove('hidden');
});


// =============================================
// 7. 퀴즈 행 생성 (단어 수만큼 행 만들기)
// =============================================

function buildQuizRows() {

  // 기존 행 초기화
  quizRowsEl.innerHTML = '';
  quizConfig = [];

  wordList.forEach(function(word, index) {

    // 무작위로 영어 or 한국어 중 하나를 문제로 선택
    // Math.random()은 0~1 사이 소수 → 0.5 기준으로 반반 확률
    const showEnglish = Math.random() < 0.5;

    const questionText = showEnglish ? word.english : word.korean;
    const answerKey    = showEnglish ? 'korean'  : 'english';

    // 이 행의 설정을 quizConfig에 기록
    quizConfig.push({
      word: word,       // 원본 단어 객체
      answerKey: answerKey // 정답이 english인지 korean인지
    });

    // 행(div.quiz-row) 생성
    const row = document.createElement('div');
    row.classList.add('quiz-row');
    row.dataset.index = index; // 나중에 정답 확인 시 사용

    row.innerHTML = `
      <div class="quiz-question">${questionText}</div>
      <input type="text" class="quiz-answer" placeholder="정답 입력">
      <div class="quiz-result"></div>
    `;

    quizRowsEl.appendChild(row);
  });
}


// =============================================
// 8. 정답 확인
// =============================================

btnCheck.addEventListener('click', function() {

  // 모든 퀴즈 행을 순회
  const rows = quizRowsEl.querySelectorAll('.quiz-row');

  rows.forEach(function(row, index) {

    const answerInput  = row.querySelector('.quiz-answer');
    const resultEl     = row.querySelector('.quiz-result');
    const config       = quizConfig[index];

    // 사용자 입력값 (소문자로 통일해서 비교 — 대소문자 무시)
    const userAnswer   = answerInput.value.trim().toLowerCase();
    const correctAnswer = config.word[config.answerKey].trim().toLowerCase();

    // 기존 정답/오답 클래스 초기화
    answerInput.classList.remove('correct', 'wrong');
    resultEl.classList.remove('result-correct', 'result-wrong');

    if (userAnswer === correctAnswer) {
      // 정답
      answerInput.classList.add('correct');
      resultEl.classList.add('result-correct');
      resultEl.textContent = '✓ 정답';
    } else {
      // 오답
      answerInput.classList.add('wrong');
      resultEl.classList.add('result-wrong');
      // 틀렸을 때 정답도 함께 보여줌
      resultEl.textContent = `✗ ${config.word[config.answerKey]}`;
    }
  });
});


// =============================================
// 9. 재시도 — 무작위 다시 섞기
// =============================================

btnRetry.addEventListener('click', function() {
  buildQuizRows(); // 퀴즈 행을 새로 생성하면 무작위가 다시 적용됨
});


// =============================================
// 10. 단어 입력으로 돌아가기
// =============================================

btnBack.addEventListener('click', function() {
  quizSection.classList.add('hidden');
  inputSection.classList.remove('hidden');
});

// =============================================
// 11. Service Worker 등록 (PWA)
// =============================================

// 페이지 로드 시 저장된 단어 목록 바로 표시
renderWordList();

// 브라우저가 Service Worker를 지원하는지 먼저 확인
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', function() {
//       navigator.serviceWorker.register('./sw.js')
//         .then(function() {
//           console.log('Service Worker 등록 성공');
//         })
//         .catch(function(err) {
//           console.log('Service Worker 등록 실패:', err);
//         });
//     });

    
// file:// 환경에서는 Service Worker 등록 건너뜀
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function() {
        console.log('Service Worker 등록 성공');
      })
      .catch(function(err) {
        console.log('Service Worker 등록 실패:', err);
      });
  });
  }