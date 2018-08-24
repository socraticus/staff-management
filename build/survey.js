"use strict";

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
surveyForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Capture filled data

    var biggestProblem = document.getElementById('biggestProblem').value;
    var prevExplain = document.getElementById('prevExplain').value;
    var goalTreatment = document.getElementById('goalTreatment').value;
    var problemGone = document.getElementById('problemGone').value;
    var triedPast = document.getElementById('triedPast').value;
    var thisYear = document.getElementById('thisYear').value;
    var biggestBenefit = document.getElementById('biggestBenefit').value;
    var firstName = document.getElementById('fNameSurvey').value;
    if (firstName === "") {
        firstName = "Anon";
    } else {
        firstName = firstName;
    };
    var lastName = document.getElementById('lNameSurvey').value;
    if (lastName === "") {
        lastName = "Anon";
    } else {
        lastName = lastName;
    };
    var facialist = document.getElementById('facialistSelect').value;

    // submit captured data to firestore
    console.log(firstName, lastName);
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
    }).then(function () {
        console.log('Data saved in Firestore');
    });
});

document.getElementById("previousConditional").style.display = 'none';

function condLoad(x) {
    if (x === 0) {
        document.getElementById("previousConditional").style.display = 'block';
        document.getElementById("previousNo").checked = false;
    } else {
        document.getElementById("previousConditional").style.display = 'none';
        document.getElementById("previousYes").checked = false;
        return;
    }
}