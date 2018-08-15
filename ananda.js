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


// HTML Elemnt Variables
const submissionsList = document.querySelector('#submissions-list');
const facialForm = document.querySelector('#facial-form-eng');
const wrapper = document.getElementById("signature-pad");
const canvas = document.getElementById("canvas");

// Firebase variables
const storage = firebase.storage();

// render submissions in DIVs
const searchSortBar = document.getElementById("searchSortBar");
const formViewer = document.getElementById("FormViewer");
// Form Input variables
let firstName
let lastName
let createdAt
let HearFromUs


// get data from firebase
db.collection('Customers').get().then((snapshot) => {
    snapshot.docs.forEach(custRef => {
        renderSubmissionDIVs(custRef);
    })
});




function renderSubmissionDIVs(custRef) {
		let formRow = document.createElement("BUTTON");
    firstName = document.createElement("DIV");
    lastName = document.createElement("DIV");
    createdAt = document.createElement("DIV");
    HearFromUs = document.createElement("DIV");
    formRow.setAttribute('id', custRef.id);
    formRow.setAttribute('class', "submissionrow w-row");
    firstName.setAttribute('class', "formfield");
    lastName.setAttribute('class', "formfield");
    createdAt.setAttribute('class', "formfield");
    HearFromUs.setAttribute('class', "formfield");
    
    
  
    firstName.textContent = custRef.data().firstName;
    lastName.textContent = custRef.data().lastName;
    let newISO = new firebase.firestore.Timestamp();
    console.log(newISO);
    //let dateISO = custRef.data().createdAt; //.toISOString().slice(0, 10);
    let dateISO = custRef.get('createdAt');
    console.log(custRef.get('createdAt'));//toDate(function(){ return new Date(this.toMillis()) }));
    
    //console.log(firebase.firestore.Timestamp(dateISO));
    createdAt.textContent = moment(custRef.data().createdAt).format('lll');
    if(custRef.data().grouponCode != "") {
    HearFromUs.textContent = 'G-' + custRef.data().grouponCode
    } else  {
    HearFromUs.textContent = custRef.data().hearFromUs;
    };
    
    
    
    formRow.appendChild(firstName);
    formRow.appendChild(lastName);
    formRow.appendChild(createdAt);
    formRow.appendChild(HearFromUs);
    
  //  searchSortBar.appendChild(formRow);
  
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
        facialForm.reset();
        let customerID = e.target.firstChild.ownerDocument.activeElement.id;
        console.log(customerID);
        // Populate empty form
        // db.collection('facialForms').doc(formID).get().then((snapshot) => {
        //snapshot.docs.forEach(doc => {
        db.collection('Customers').doc(customerID).get().then( function(customerRef) {
          let formID = customerRef.data().facialFormId;
              console.log(formID);
              db.collection('facialForms').doc(formID).get().then(
                (formRef) => {    
                    fillForm(formRef)
                }
              );
        });
       
       
    	function fillForm(formRef) {
            document.getElementById("fNameId").value = formRef.data().firstName;
            document.getElementById("lNameId").value = formRef.data().lastName;
            document.getElementById("DOBId").value = formRef.data().DateOfBirth;
            document.getElementById("AddressId").value = formRef.data().Address;
            document.getElementById("HearFromUs").value = formRef.data().hearFromUs;
            // Checkboxes
            let checkedExpCheckbox = formRef.data().expChecked;
            console.log(checkedExpCheckbox);
            if(checkedExpCheckbox === undefined) {
                return
            } else {
            for(i = 0; i < checkedExpCheckbox.length; i++) {
            document.getElementById(checkedExpCheckbox[i]).checked = true
            }
            }
            // Radio buttons
            checkedGroupon = formRef.data().haveGroupon;
            document.getElementById(checkedGroupon).checked = true;

            // Display saved signature
            // Get Image from Firebase
            var sig = new Image;
            var gsImageRef = storage.refFromURL('gs://ananda-spa-user-profile.appspot.com/facialFormSignatures/' + formRef.id);

            gsImageRef.getDownloadURL().then(function(url) {            
                sig.src = url;
                sig.addEventListener('load', loadSignature, false);
            });

            function loadSignature(canvas) {
                canvas = document.getElementById("canvas");                
                var context = canvas.getContext("2d");
                context.drawImage(sig, 0, 0);
                signaturePad = null;
            };

        };

  
  };
     
      });
      
  };



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

// Call Signature Pad App
var clearButton = wrapper.querySelector("[data-action=clear]");
var signaturePad = new SignaturePad(canvas, {
    // It's Necessary to use an opaque color when saving image as JPEG;
    // this option can be omitted if only saving as PNG or SVG
    backgroundColor: 'rgb(255, 255, 255)'
});

// Adjust canvas coordinate space taking into account pixel ratio,
// to make it look crisp on mobile devices.
// This also causes canvas to be cleared.
function resizeCanvas() {
    // When zoomed out to less than 100%, for some very strange reason,
    // some browsers report devicePixelRatio as less than 1
    // and only part of the canvas is cleared then.
    var ratio =  Math.max(window.devicePixelRatio || 1, 1);

    // This part causes the canvas to be cleared
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    // This library does not listen for canvas changes, so after the canvas is automatically
    // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
    // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
    // that the state of this library is consistent with visual state of the canvas, you
    // have to clear it manually.
    signaturePad.clear();
}

// On mobile devices it might make more sense to listen to orientation change,
// rather than window resize events.
window.onresize = resizeCanvas;
resizeCanvas();

function download(dataURL, docRefVar) {
    var blob = dataURLToBlob(dataURL);
    var url = window.URL.createObjectURL(blob);

    //Send Image to Firebase storage
    var storageRef = storage.ref('facialFormSignatures/' + docRefVar);
    storageRef.put(blob);

    window.URL.revokeObjectURL(url);
}

// One could simply use Canvas#toBlob method instead, but it's just to show
// that it can be done using result of SignaturePad#toDataURL.
function dataURLToBlob(dataURL) {
    // Code taken from https://github.com/ebidel/filer.js
    var parts = dataURL.split(';base64,');
    var contentType = parts[0].split(":")[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);
    
    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

// clearButton.addEventListener("click", function (event) {
//   signaturePad.clear();
// });


document.getElementById("Groupon-example").style.display='none';

function condLoad(x) {
		if (x === 0)
    document.getElementById("Groupon-example").style.display='block';
    else
    document.getElementById("Groupon-example").style.display='none';
    return
}
