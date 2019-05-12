// DOM variable declarations
var serverURL = 'https://ananda-spa-apitest.herokuapp.com';

// Initialize Vue instance


function testingVue() {
    console.log('accessed from HTML');
    Facialform.testing();
}


window.onload = function () {

    var Facialform = new Vue({
        el: '#vue-facial-form',
        data: {
            title: 'This is a Form Demo',
            step: 1,
            personal: {
                fullname: "",
                email: "",
                phone: "",
                address: "",
                city_zip_state: "",
                Birthdate: ""
            },
            health: {
                wearcontact: false,
                surgery: false,
                surgerydescribe: "",
                skincancer: false,
                dermatitis: false,
                keloidscarring: false,
                acne: false,
                rosacea: false,
                broken: false,
                treatment: false,
                hypo: false,
                hyperpig: false,
                burns: false,
                anycondition: false,
                anyconditiondescription: "",
                allergies: false,
                latexallergies: false,
                otherallergies: false,
                otherallergiesdescription: "",
                prescription: false,
                prescriptiondescription: "",
                pregnant: false,
                technician: false,
                techniciandescription: "",
            },
            skincare: {
                appointment: "",
                oftenfacials: "",
                oftenbody: "",
                cosmetic: false,
                finelines: false,
                wrinkles: false,
                dull: false,
                loss: false,
                dry: false,
                oily: false,
                pores: false,
                redness: false,
                sensit: false,
                dark: false,
                pimples: false,
                skin: false,
                other: false,
                otherextradescription: ""
            },
            homecare: {
                routine: "",
                cleanser: false,
                toner: false,
                moisturizer: false,
                spf: false,
                vitamin: false,
                scrubs: false,
                speciality: false,
                mask: false,
                supplements: false,
                exercise: false,
                scar: false,
                skinsensitive: false,
            },
            pictures: false,
            signature: ""

        },
        watch: {

        },

        methods: {
            prev() {
                this.step--;
            },
            next() {
                this.step++;
            },

        },
        computed: {

        },
        filters: {

        }
    });





};