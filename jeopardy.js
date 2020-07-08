// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]
const catNums = 6;
const clueNums = 5;
let categories = [];

const randomColor = (() => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
});

setInterval(function() {
  const $titleLetters = $('span');
  for (let $letter of $titleLetters) {
    const rgb = randomColor();
    $letter.style.textShadow = `3px 3px ${rgb}`;
  }
}, 2000);

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds(amount) {
  const response = await axios.get(`https://jservice.io/api/categories?count=100`);
  // console.log(response);
  const categoriesArr = _.sampleSize(response.data, amount);
  // console.log(categoriesArr);
  const categoriesIdArr = categoriesArr.reduce((acc, next) => {
    acc.push(next.id);
    return acc
  }, []);
  // console.log(categoriesIdArr);
  return categoriesIdArr;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId, amount) {
  const response = await axios.get(`http://jservice.io/api/category?id=${catId}`);
  // console.log(response);
  const cluesSampleArr = _.sampleSize(response.data.clues, amount);
  const cluesObjArr = cluesSampleArr.reduce((acc, next) => {
    const clueObj = {
      id: next.id,
      question: next.question,
      answer: next.answer,
      showing: null
    }
    acc.push(clueObj);
    return acc;
  }, []);
  const catCluesObj = {
    title: response.data.title,
    clues: cluesObjArr
  }
  // console.log(catCluesObj);
  return catCluesObj;
}


/**
 * Make the Jeopardy game table 
 *
 */

function makeTable(catNum, clueNum) {
  const $row = $('<div class="row">');
  for (let col = 0; col < catNum; col++) {
    const $col = $(`<div class="col-2 tableCol" id="cat${col+1}">`);
    const $header = $(`<div class="tableColHead rounded" id="cat${col+1}-h">`);
    $col.append($header);
    for (let row = 0; row < clueNum; row++) {
      const $cell = $(`<div class="tableCell rounded justify-content-center align-items-center" id="cat${col+1}-q${row+1}">`);
      $cell.on('click', showQuestionDiv);
      $col.append($cell);
    }
    $row.append($col);
  }
  $("#jeopardy").append($row);
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable(catNum, clueNum) {
  const idArr = await getCategoryIds(catNum);
  // console.log(idArr);
  for (let col = 0; col < idArr.length; col++) {
    // adding in the category titles through looping over each col
    const catObj = await getCategory(idArr[col], clueNums);
    categories.push(catObj);
    const $catDiv = $(`<div class="catDiv text-center">`);
    $catDiv.attr('data-cat-index', col);
    // $catDiv.attr('data-cat-title', catObj.title);
    $catDiv.text(catObj.title);
    $(`#cat${col+1}-h`).append($catDiv);
    for (let row = 0; row < clueNum; row++) {
      // adding the categories' questions and answers as data and the question mark
      const clueArr = catObj.clues;
      const $qDiv = $(`<div class="qDiv text-left overflow-auto">`);
      $qDiv.attr('data-cat-index', col);
      $qDiv.attr('data-clue-index', row);
      // $qDiv.attr(`data-clue-question`, clueArr[row].question);
      // $qDiv.attr(`data-clue-answer`, clueArr[row].answer);
      const $questionMark = $(`<i class="far fa-question-circle h2">`);
      $questionMark.on('click', handleClick);
      $questionMark.on('mouseenter', mouseenterEffect);
      $questionMark.on('mouseleave', mouseleaveEffect);
      $(`#cat${col+1}-q${row+1}`).append($questionMark);
      // $qDiv.append($questionMark);
      $qDiv.on('click', handleClick);
      $qDiv.on('mouseenter', mouseenterEffect);
      $qDiv.on('mouseleave', mouseleaveEffect);
      $qDiv.hide();
      $(`#cat${col+1}-q${row+1}`).append($qDiv);
    }
  }
}

function showQuestionDiv(evt) {
  if (evt.target.classList.contains("clicked")) {
    return;
  }
  else if (evt.target.classList.contains('tableCell') || evt.target.tagName === "I") {
    const $target = (evt.target.classList.contains('tableCell') ? $(evt.target) : $(evt.target.parentElement));
    $target.addClass("clicked");
    const dataId = $target.attr("data-id");
    const $qDiv = $target.children(".qDiv");
    $qDiv.show();
    const $questionMark = $target.children("i");
    $questionMark.hide();
    $qDiv.css("color", "white");
    $qDiv.css("border-top", "2px solid red");
    const catIndex = $qDiv.attr('data-cat-index');
    const clueIndex = $qDiv.attr('data-clue-index');
    // console.log(catIndex, clueIndex);
    const clueQuestion = categories[catIndex].clues[clueIndex].question;
    const clueAnswer = categories[catIndex].clues[clueIndex].answer;
    let clueShowing = categories[catIndex].clues[clueIndex].showing;
    if (clueShowing === null) {
    $qDiv.html("");
    $qDiv.html('<p class="something">' + clueQuestion + '</p>');
    categories[catIndex].clues[clueIndex].showing = "question";
    }
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  if (evt.target.classList.contains('qDiv') || evt.target.tagName === "P") {
    const $target = (evt.target.classList.contains('qDiv') ? $(evt.target) : $(evt.target.parentElement));
    // $target.css("color", "white");
    // $target.css("border", "1px solid red");
    const catIndex = $target.attr('data-cat-index');
    const clueIndex = $target.attr('data-clue-index');
    // // console.log(catIndex, clueIndex);
    const clueQuestion = categories[catIndex].clues[clueIndex].question;
    const clueAnswer = categories[catIndex].clues[clueIndex].answer;
    let clueShowing = categories[catIndex].clues[clueIndex].showing;
    // if (clueShowing === null) {
    //   $target.html("");
    //   $target.html('<p class="something" style="display:block;overflow:auto;">' + clueQuestion + '</p>');
    //   categories[catIndex].clues[clueIndex].showing = "question";
    // }
    if (clueShowing === "question") {
      $target.html('');
      $target.text(clueAnswer);
      clueShowing = "answer";
      $target.css({
        "display": "flex",
        "border": "2px solid green",
        "font-size": "0.9rem"
      })
      // $target.css("display", "flex");
      $target.addClass("justify-content-center");
      $target.addClass("align-items-center");
      // $target.css("border", "2px solid green");
      // $target.css("font-size", "0.9rem");
    }
  }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  $('#jeopardy').html("");
  $('#loading').html("");
  categories = [];
  const loadingIcon = $(`
  <div class="fa-10x text-center">
    <i class="fas fa-spinner fa-spin loadingIcon"></i>
  </div>
  `);
  $('#loading').append(loadingIcon);
  $('#start').css('display','none');
  $('#jeopardy').css('display','none');
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView(duration) {
  setTimeout(async function() {
    $('#loading').html("");
    await $('#jeopardy').css('display','block');
    $('#start').css('display','block');
  }, duration);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();
  hideLoadingView(1500);
  setTimeout( async function() {
    makeTable(6,5);
    await fillTable(6,5);
    startUpEffect();
  }, 1500);
}

/** On click of start / restart button, set up game. */

// TODO

$('#start').on('click', function(evt) {
  $(this).html("");
    const $restart = $(`
      <div class="col-12 text-center">
        <i class="fas fa-redo-alt"></i>
      </div>
      <div class="col-12 text-center">
        <p class="h2">RESTART</p>
      </div>
    `);
    $(this).append($restart);
  setupAndStart();
})

/** On page load, add event handler for clicking clues */

// TODO

function startUpEffect() {
  for (let col = 0; col < catNums; col++) {
    if (col === 0) {
      for (let row = 0; row < clueNums; row++) {
        $(`#cat${col+1}-q${row+1}`).css("border", "2px solid white");
        $(`#cat${col+1}-q${row+1}`).css("color", "white");
      }
    } else if (col === 5) {
      setTimeout(function() {
        for (let row = 0; row < clueNums; row++) {
          $(`#cat${col}-q${row+1}`).css("border", "2px solid #828487");
          $(`#cat${col}-q${row+1}`).css("color", "#828487");
          $(`#cat${col+1}-q${row+1}`).css("border", "2px solid white");
          $(`#cat${col+1}-q${row+1}`).css("color", "white");
        }
      }, 100*5);
      setTimeout(function() {
        for (let row = 0; row < clueNums; row++) {
          $(`#cat${col+1}-q${row+1}`).css("border", "2px solid #828487");
          $(`#cat${col+1}-q${row+1}`).css("color", "#828487");
        }
      }, 100*6);
    } else {
      setTimeout(function() {
        for (let row = 0; row < clueNums; row++) {
          $(`#cat${col}-q${row+1}`).css("border", "2px solid #828487");
          $(`#cat${col}-q${row+1}`).css("color", "#828487");
          $(`#cat${col+1}-q${row+1}`).css("border", "2px solid white");
          $(`#cat${col+1}-q${row+1}`).css("color", "white");
        }
      }, 100*col);
    }
  }
}

function mouseenterEffect(evt) {
  $(this).css("color", "white");
  $(this).css("transition", "color 300ms");
}
function mouseleaveEffect(evt) {
  $(this).css("color", "#828487");
  $(this).css("transition", "color 300ms");
}
// fillTable(6,5);