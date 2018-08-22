  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDbVv1bVyoARmdFXccAkBM8-eAgG_LuVGU",
    authDomain: "ananda-spa-user-profile.firebaseapp.com",
    databaseURL: "https://ananda-spa-user-profile.firebaseio.com",
    projectId: "ananda-spa-user-profile",
    storageBucket: "ananda-spa-user-profile.appspot.com",
    messagingSenderId: "265611520363"
  };
  firebase.initializeApp(config);
  var db = firebase.firestore();
  db.settings({ timestampsInSnapshots: true })


// HTML Elemnt Variables
const surveyForm = document.querySelector('#wf-form-Survey-Form-Eng');


// save data to firestore
surveyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Capture filled data

    let biggestProblem = document.getElementById('biggestProblem').value;
    let prevExplain = document.getElementById('prevExplain').value;
    let goalTreatment = document.getElementById('goalTreatment').value;
    let problemGone = document.getElementById('problemGone').value;
    let triedPast = document.getElementById('triedPast').value;
    let thisYear = document.getElementById('thisYear').value;
    let biggestBenefit = document.getElementById('biggestBenefit').value;
    let firstName = document.getElementById('fNameSurvey').value;
    let lastName = document.getElementById('lNameSurvey').value;
    let facialist = document.getElementById('facialistSelect').value;
    

    
    // submit captured data to firestore
     db.collection('marketingSurvey').add({        
        createdAt: Date.now(), 
        biggestProblem: biggestProblem,
        prevExplain: prevExplain,
        goalTreatment: goalTreatment,
        problemGone: problemGone,
        triedPast: triedPast,
        firstName: firstName,
        lastName: lastName,
        thisYear: thisYear,
        biggestBenefit: biggestBenefit,
        facialist: facialist
    });
    

        
});



document.getElementById("previousConditional").style.display='none';

function condLoad(x) {
	if (x === 0) {
    document.getElementById("previousConditional").style.display='block';
    } else {
    document.getElementById("previousConditional").style.display='none';
    return
    }
}