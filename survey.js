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

// Form Input variables
let firstName;
let lastName;
let createdAt;
let facialist;

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
    firstName = document.getElementById('fNameSurvey').value;
    lastName = document.getElementById('lNameSurvey').value;
    
    // Radio Sections
    let radioGroupon = document.getElementsByName('haveGroupon')
    let checkedGroupon
    if(radioGroupon[0].checked === true) {
    		checkedGroupon = radioGroupon[0].id
        } else {checkedGroupon = radioGroupon[1].id}
    
    
    let getExpCheckbox = document.getElementsByName('expCheckbox');
    let checkedExpCheckbox = []
    getExpCheckbox.forEach((item) => {
    		if(item.checked === true) {
    				checkedExpCheckbox.push(item.id)
    		} else {}
     });
    
    
    // submit captured data to firestore
     db.collection('facialForms').add({
        // date: new Date().toISOString().slice(0, 10),
        createdAt: Date.now(), //firebase.firestore.FieldValue.serverTimestamp(),
        hearFromUs: facialForm.HearFromUs.value,
        expChecked: checkedExpCheckbox,
        haveGroupon: checkedGroupon,
        Address: facialForm.AddressId.value,
        DateOfBirth: facialForm.DOBId.value,
        firstName: facialForm.fNameId.value,
        lastName: facialForm.lNameId.value,
        email: facialForm.emailId.value,
        phone: facialForm.phoneId.value,
        grouponCode: facialForm.grouponCodeId.value,
        customerId: ""
    	}).then(function(docRef) {
            var docRefVar = docRef.id;

            // Save Signature Pad Data
            var dataURL = signaturePad.toDataURL();
            console.log(docRef.id)
            download(dataURL, docRefVar);

            // Add fields in 'Customers' collection
            
            db.collection('Customers').add({
            firstName: facialForm.fNameId.value,
            lastName: facialForm.lNameId.value,
            facialFormId: docRef.id,
            hearFromUs: facialForm.HearFromUs.value,
            createdAt: Date.now(), //firebase.firestore.FieldValue.serverTimestamp(),
            grouponCode: facialForm.grouponCodeId.value,
            }).then(function(custRef) {
            console.log(custRef.id)
                db.collection('facialForms').doc(docRefVar).update({
                customerId: custRef.id
                });    
            });
        });

    

        
});




document.getElementById("Groupon-example").style.display='none';

function condLoad(x) {
		if (x === 0)
    document.getElementById("Groupon-example").style.display='block';
    else
    document.getElementById("Groupon-example").style.display='none';
    return
}
