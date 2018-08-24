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

// HTML Elemnt Variables
var submissionsList = document.querySelector('#submissions-list');
var surveyForm = document.querySelector('#wf-form-Survey-Form-Eng');
document.getElementById("FormViewer").style.display = "none";

// render submissions in DIVs
var searchSortBar = document.getElementById("searchSortBar");
var formViewer = document.getElementById("FormViewer");
// Form Input variables
var firstName = void 0;
var lastName = void 0;
var createdAt = void 0;
var facialist = void 0;

// get data from firebase
db.collection('marketingSurveyEng').get().then(function (snapshot) {
    snapshot.docs.forEach(function (custRef) {
        renderSubmissionDIVs(custRef);
    });
});

function renderSubmissionDIVs(custRef) {
    var formRow = document.createElement("BUTTON");
    firstName = document.createElement("DIV");
    lastName = document.createElement("DIV");
    createdAt = document.createElement("DIV");
    surveyID = document.createElement("DIV");
    formRow.setAttribute('id', custRef.id);
    formRow.setAttribute('class', "submissionrow w-row");
    firstName.setAttribute('class', "formfield");
    lastName.setAttribute('class', "formfield");
    createdAt.setAttribute('class', "formfield");
    surveyID.setAttribute('class', "formfield");

    firstName.textContent = custRef.data().firstName;
    lastName.textContent = custRef.data().lastName;
    // Using moment library to render ISO Date
    createdAt.textContent = moment(custRef.data().createdAt).format('l');
    surveyID.textContent = custRef.id.slice(0, 5);

    formRow.appendChild(firstName);
    formRow.appendChild(lastName);
    formRow.appendChild(createdAt);
    formRow.appendChild(surveyID);

    /*beforebegin - before element
      afterbegin - first child
      beforeend - last child
      afterend - after element */

    searchSortBar.insertAdjacentElement("beforeend", formRow);

    // Display submitted empty form
    formRow.addEventListener('click', function (e) {
        if (formViewer.style.display === "block") {
            formViewer.style.display = "none";
        } else {
            formRow.insertAdjacentElement("afterend", formViewer);
            formViewer.style.display = "block";
            surveyForm.reset();
            var refID = e.target.firstChild.ownerDocument.activeElement.id;
            console.log(refID);
            // Populate empty form
            db.collection('marketingSurveyEng').doc(refID).get().then(function (formRef) {
                fillForm(formRef);
            });
        };

        function fillForm(formRef) {
            surveyForm.reset();
            document.getElementById("fNameSurvey").value = formRef.data().firstName;
            document.getElementById("lNameSurvey").value = formRef.data().lastName;

            document.getElementById("biggestProblem").outerHTML = "<div id='biggestProblem' class='select-form-empty'></div>";
            document.getElementById("biggestProblem").innerHTML = formRef.data().biggestProblem;
            //Display Conditional
            if (formRef.data().prevExplain === "") {
                document.getElementById("previousNo").setAttribute("checked", "checked");
                document.getElementById("previousConditional").style.display = 'none';
            } else {
                document.getElementById("previousConditional").style.display = 'block';
                document.getElementById("previousYes").setAttribute("checked", "checked");
                document.getElementById("prevExplain").value = formRef.data().prevExplain;
            };

            // Continue rendering form
            document.getElementById("goalTreatment").outerHTML = "<div id='goalTreatment' class='select-form-empty'></div>";
            document.getElementById("goalTreatment").innerHTML = formRef.data().goalTreatment;

            document.getElementById("problemGone").outerHTML = "<div id='problemGone' class='select-form-empty'></div>";
            document.getElementById("problemGone").innerHTML = formRef.data().problemGone;

            document.getElementById("triedPast").outerHTML = "<div id='triedPast' class='select-form-empty'></div>";
            document.getElementById("triedPast").innerHTML = formRef.data().triedPast;

            document.getElementById("thisYear").outerHTML = "<div id='thisYear' class='select-form-empty'></div>";
            document.getElementById("thisYear").innerHTML = formRef.data().thisYear;

            document.getElementById("biggestBenefit").outerHTML = "<div id='biggestBenefit' class='select-form-empty'></div>";
            document.getElementById("biggestBenefit").innerHTML = formRef.data().biggestBenefit;

            document.getElementById("facialistSelect").value = formRef.data().facialist;
        };
    });

    document.getElementById("previousConditional").style.display = 'none';

    function condLoad(x) {
        if (x === 0) {
            document.getElementById("previousConditional").style.display = 'block';
        } else {
            document.getElementById("previousConditional").style.display = 'none';
            return;
        }
    };
};