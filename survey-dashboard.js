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
const submissionsList = document.querySelector('#submissions-list');
const surveyForm = document.querySelector('#wf-form-Survey-Form-Eng');

// render submissions in DIVs
const searchSortBar = document.getElementById("searchSortBar");
const formViewer = document.getElementById("FormViewer");
// Form Input variables
let firstName;
let lastName;
let createdAt;
let facialist;


// get data from firebase
db.collection('marketingSurveyEng').get().then((snapshot) => {
    snapshot.docs.forEach(custRef => {
        renderSubmissionDIVs(custRef);
    })
});

function renderSubmissionDIVs(custRef) {
		let formRow = document.createElement("BUTTON");
    firstName = document.createElement("DIV");
    lastName = document.createElement("DIV");
    createdAt = document.createElement("DIV");
    facialist = document.createElement("DIV");
    formRow.setAttribute('id', custRef.id);
    formRow.setAttribute('class', "submissionrow w-row");
    firstName.setAttribute('class', "formfield");
    lastName.setAttribute('class', "formfield");
    createdAt.setAttribute('class', "formfield");
    facialist.setAttribute('class', "formfield");
    
    
    if (custRef.data.firstName === '') {

    }
    firstName.textContent = custRef.data().firstName;
    lastName.textContent = custRef.data().lastName;
    // Using moment library to render ISO Date
    createdAt.textContent = moment(custRef.data().createdAt).format('l');
    facialist.textContent = custRef.data().facialist   ;
    
    formRow.appendChild(firstName);
    formRow.appendChild(lastName);
    formRow.appendChild(createdAt);
    formRow.appendChild(facialist);
    
  
  /*beforebegin - before element
    afterbegin - first child
    beforeend - last child
    afterend - after element */
    
  searchSortBar.insertAdjacentElement("beforeend", formRow);

 
  
  // Display submitted empty form
  formRow.addEventListener('click', (e) => {
      if (formViewer.style.display === "block") {
          formViewer.style.display = "none";      
      } else {
  		formRow.insertAdjacentElement("afterend", formViewer);
        formViewer.style.display = "block";
        surveyForm.reset();
        let surveyID = e.target.firstChild.ownerDocument.activeElement.id;
        console.log(surveyID);
        // Populate empty form
        db.collection('marketingSurveyEng').doc(surveyID).get().then( (formRef) => {    
            fillForm(formRef)
            });
        };
       
       
    	function fillForm(formRef) {
            document.getElementById("fNameSurvey").value = formRef.data().firstName;
            document.getElementById("lNameSurvey").value = formRef.data().lastName;
            document.getElementById("biggestProblem").outerHTML = "<div id='biggestProblem' class='select-form-empty'></div>"
            document.getElementById("biggestProblem").innerHTML = formRef.data().biggestProblem;
            //Display Conditional
            if (formRef.data().prevExplain === "") {
                document.getElementById("previousNo").setAttribute("checked", "checked")
                document.getElementById("previousConditional").style.display = 'none'
            } else {
                document.getElementById("previousConditional").style.display = 'block';
                document.getElementById("previousYes").setAttribute("checked", "checked")
                document.getElementById("prevExplain").value = formRef.data().prevExplain;
            };
            // Continue rendering form
            document.getElementById("goalTreatment").innerHTML = formRef.data().goalTreatment;
            document.getElementById("problemGone").value = formRef.data().problemGone;
            document.getElementById("triedPast").value = formRef.data().triedPast;
            document.getElementById("thisYear").value = formRef.data().thisYear;
            document.getElementById("biggestBenefit").value = formRef.data().biggestBenefit;
            document.getElementById("facialistSelect").value = formRef.data().facialist;           
        };

        });




document.getElementById("previousConditional").style.display='none';

function condLoad(x) {
	if (x === 0) {
    document.getElementById("previousConditional").style.display='block';
    }  else {
    document.getElementById("previousConditional").style.display='none';
    return
    }
    };
};
