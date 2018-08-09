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
  const db = firebase.firestore();
  db.settings({ timestampsInSnapshots: true })



const submissionsList = document.querySelector('#submissions-list');
const facialForm = document.querySelector('#facial-form-eng');

{/* function renderSubmissions(doc) {
    let li = document.createElement('li');
    let firstName = document.createElement('span');
    let lastName = document.createElement('span');
    let email = document.createElement('span');
    let phone = document.createElement('span');

    li.setAttribute('data-id', doc.id);
    firstName.textContent = doc.data().firstName;
    lastName.textContent = doc.data().lastName;
    email.textContent = doc.data().email;
    phone.textContent = doc.data().phone;

    li.appendChild(firstName);
    li.appendChild(lastName);
    li.appendChild(email);
    li.appendChild(phone);

    submissionsList.appendChild(li);
}


// get data from firebase
db.collection('Customers').get().then((snapshot) => {
    snapshot.docs.forEach(doc => {
        renderSubmissions(doc);
    })
}); */}

// render submissions in DIVs
const searchSortBar = document.getElementById("searchSortBar");
const formViewer = document.getElementById("FormViewer");
// Form Input variables
let firstName
let lastName
let email
let HearFromUs


function renderSubmissionDIVs(doc) {
		let formRow = document.createElement("BUTTON");
    firstName = document.createElement("DIV");
    lastName = document.createElement("DIV");
    email = document.createElement("DIV");
    HearFromUs = document.createElement("DIV");
    formRow.setAttribute('id', doc.id);
    formRow.setAttribute('class', "submissionrow w-row");
    firstName.setAttribute('class', "forgit mfield");
    lastName.setAttribute('class', "formfield");
    email.setAttribute('class', "formfield");
    HearFromUs.setAttribute('class', "formfield");
    //formRow.setAttribute('onclick', "window.open('http://www.brightcherry.co.uk/');");
        
    firstName.textContent = doc.data().firstName;
    lastName.textContent = doc.data().lastName;
    email.textContent = doc.data().email;
    if(doc.data().grouponCode != "") {
    HearFromUs.textContent = 'G-' + doc.data().grouponCode
    } else  {
    HearFromUs.textContent = doc.data().hearFromUs;
    };
    
    
    
    formRow.appendChild(firstName);
    formRow.appendChild(lastName);
    formRow.appendChild(email);
    formRow.appendChild(HearFromUs);
    
  //  searchSortBar.appendChild(formRow);
  
  /*beforebegin - before element
    afterbegin - first child
    beforeend - last child
    afterend - after element */
    
  searchSortBar.insertAdjacentElement("beforeend", formRow);
  
  
  // Display submitted empty form
  formRow.addEventListener('click', (e) => {
  		if (formViewer.style.display === "none") {
  		formRow.insertAdjacentElement("afterend", formViewer);
  		formViewer.style.display = "block";
      let formID = e.target.firstChild.ownerDocument.activeElement.id;
      console.log(formID);
      // Populate empty form
      // db.collection('facialForms').doc(formID).get().then((snapshot) => {
    //snapshot.docs.forEach(doc => {
        db.collection('facialForms').doc(formID).get().then(
        fillForm(doc));
    
   
    	function fillForm(doc) {
      document.getElementById("fNameId").value = doc.data().firstName;
      document.getElementById("lNameId").value = doc.data().lastName;
      document.getElementById("DOBId").value = doc.data().DateOfBirth;
      document.getElementById("AddressId").value = doc.data().Address;
      document.getElementById("HearFromUs").value = doc.data().hearFromUs;
      // Checkboxes
      let checkedExpCheckbox = doc.data().expChecked;
      console.log(checkedExpCheckbox);
      if(checkedExpCheckbox === undefined) {
      		return
      } else {
      for(i = 0; i < checkedExpCheckbox.length; i++) {
      document.getElementById(checkedExpCheckbox[i]).checked = true
      	}
      }
      // Radio buttons
      checkedGroupon = doc.data().haveGroupon;
      document.getElementById(checkedGroupon).checked = true;
    }}
      else {
        formViewer.style.display = "none";
        }
      }
      
      
});
      
      
      
  });
  
  
}

// get data from firebase
db.collection('facialForms').get().then((snapshot) => {
    snapshot.docs.forEach(doc => {
        renderSubmissionDIVs(doc);
    })
});

// save data to firestore
facialForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Capture filled data
    
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
    
    /* //Previous data Structure
    // submit captured data to firestore
    db.collection('Customers').add({
        firstName: facialForm.fNameId.value,
        lastName: facialForm.lNameId.value,
        email: facialForm.emailId.value,
        phone: facialForm.phoneId.value
    }).then(function(docRef) {
    		console.log(docRef.id)
        db.collection('Customers').doc(docRef.id).collection('formDetails').add({
        hearFromUs: facialForm.HearFromUs.value,
        expChecked: checkedExpCheckbox,
        haveGroupon: checkedGroupon,
        Address: facialForm.AddressId.value,
        DateOfBirth: facialForm.DOBId.value
    });
    });
    */
    
    // New Data Structure
    // submit captured data to firestore
     db.collection('facialForms').add({
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
      	var docRefVar = docRef.id
    		console.log(docRef.id)
        db.collection('Customers').add({
        firstName: facialForm.fNameId.value,
        lastName: facialForm.lNameId.value,
        facialFormId: docRef.id,
        hearFromUs: facialForm.HearFromUs.value,
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
