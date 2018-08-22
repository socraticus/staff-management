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
    
    
  
    firstName.textContent = custRef.data().firstName;
    lastName.textContent = custRef.data().lastName;
    // Using moment library to render ISO Date
    createdAt.textContent = moment(custRef.data().createdAt).format('lll');
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
        let customerID = e.target.firstChild.ownerDocument.activeElement.id;
        console.log(customerID);
        // Populate empty form
        db.collection('Customers').doc(customerID).get().then( (formRef) => {    
            fillForm(formRef)
            });
        };
       
       
    	function fillForm(formRef) {
            document.getElementById("fNameSurvey").value = formRef.data().firstName;
            document.getElementById("lNameSurvey").value = formRef.data().lastName;
            document.getElementById("biggestProblem").value = formRef.data().biggestProblem;
            document.getElementById("prevExplain").value = formRef.data().prevExplain;
            document.getElementById("goalTreatment").value = formRef.data().goalTreatment;
            document.getElementById("problemGone").value = formRef.data().problemGone;
            document.getElementById("triedPast").value = formRef.data().triedPast;
            document.getElementById("thisYear").value = formRef.data().thisYear;
            document.getElementById("biggestBenefit").value = formRef.data().biggestBenefit;
            document.getElementById("facialistSelect").value = formRef.data().facialistSelect;           
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
