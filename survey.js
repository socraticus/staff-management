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
  db.settings({ timestampsInSnapshots: true });


// save data to firestore
var surveyForm = document.getElementById('wf-form-Survey-Form-Eng');
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
    if (firstName === "") {
        firstName = "Anonymous"
    } else {firstName = firstName};
    let lastName = document.getElementById('lNameSurvey').value;
    if (lastName === "") {
        lastName = "Anonymous"
    } else {lastName = lastName};
    let facialist = document.getElementById('facialistSelect').value;
    

    
    // submit captured data to firestore
    console.log(firstName);
    console.log(facialist);

     db.collection('marketingSurveyEng').add({        
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
    }).then(function() {
        console.log("Form submitted");
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