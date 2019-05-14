// DOM variable declarations
var serverURL = 'https://ananda-spa-apitest.herokuapp.com';

// Initialize Vue instance


function testingVue() {
    console.log('accessed from HTML');
    Facialform.testing();
}


window.onload = function () {

    var canvas = document.getElementById('signature-pad');

    // Adjust canvas coordinate space taking into account pixel ratio,
    // to make it look crisp on mobile devices.
    // This also causes canvas to be cleared.
    function resizeCanvas() {
        // When zoomed out to less than 100%, for some very strange reason,
        // some browsers report devicePixelRatio as less than 1
        // and only part of the canvas is cleared then.
        var ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
    }

    window.onresize = resizeCanvas;
    resizeCanvas();

    var signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)' // necessary for saving image as JPEG; can be removed is only saving as PNG or SVG
    });

    document.getElementById('save-png').addEventListener('click', function () {
        if (signaturePad.isEmpty()) {
            return alert("Please provide a signature first.");
        }

        var data = signaturePad.toDataURL('image/png');
        console.log(data);
        window.open(data);
    });

    document.getElementById('save-jpeg').addEventListener('click', function () {
        if (signaturePad.isEmpty()) {
            return alert("Please provide a signature first.");
        }

        var data = signaturePad.toDataURL('image/jpeg');
        console.log(data);
        window.open(data);
    });

    document.getElementById('save-svg').addEventListener('click', function () {
        if (signaturePad.isEmpty()) {
            return alert("Please provide a signature first.");
        }

        var data = signaturePad.toDataURL('image/svg+xml');
        console.log(data);
        console.log(atob(data.split(',')[1]));
        window.open(data);
    });

    document.getElementById('clear').addEventListener('click', function () {
        signaturePad.clear();
    });

    document.getElementById('draw').addEventListener('click', function () {
        var ctx = canvas.getContext('2d');
        console.log(ctx.globalCompositeOperation);
        ctx.globalCompositeOperation = 'source-over'; // default value
    });

    document.getElementById('erase').addEventListener('click', function () {
        var ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out';
    });


    Vue.component('vue-signature', {
        template: '#vue-signature',
        props: {
            sigOption: {
                type: Object,
                default: () => {
                    return {
                        backgroundColor: 'rgb(255,255,255)',
                        penColor: 'rgb(0, 0, 0)'
                    }
                },
            },
            w: {
                type: String,
                default: "100%"
            },
            h: {
                type: String,
                default: "100%"
            },
            clearOnResize: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                sig: () => { },
                option: {
                    backgroundColor: 'rgb(255,255,255)',
                    penColor: 'rgb(0, 0, 0)'
                },
                uid: ""
            }
        },
        created() {
            var _this = this;
            this.uid = "canvas" + _this._uid
            var sigOptions = Object.keys(_this.sigOption);
            for (var item of sigOptions) {
                _this.option[item] = _this.sigOption[item]
            }
        },
        methods: {
            draw() {
                var _this = this;
                var canvas = document.getElementById(_this.uid)
                _this.sig = new SignaturePad(canvas, _this.option);
                function resizeCanvas() {
                    var url;
                    if (!_this.isEmpty()) {
                        url = _this.save();
                    }
                    var ratio = Math.max(window.devicePixelRatio || 1, 1);
                    canvas.width = canvas.offsetWidth * ratio;
                    canvas.height = canvas.offsetHeight * ratio;
                    canvas.getContext("2d").scale(ratio, ratio);
                    _this.clear();
                    !_this.clearOnResize && url !== undefined && _this.fromDataURL(url)
                }
                window.addEventListener("resize", resizeCanvas);
                resizeCanvas();
            },
            clear() {
                var _this = this;
                _this.sig.clear();
            },
            save(format) {
                var _this = this;
                return format ? _this.sig.toDataURL(format) : _this.sig.toDataURL()
                // signaturePad.toDataURL(); // save image as PNG
                // signaturePad.toDataURL("image/jpeg"); // save image as JPEG
                // signaturePad.toDataURL("image/svg+xml"); // save image as SVG
            },
            fromDataURL(url) {
                var _this = this;
                _this.sig.fromDataURL(url)
            },
            isEmpty() {
                var _this = this;
                return _this.sig.isEmpty();
            },
            undo() {
                var _this = this;
                var data = _this.sig.toData();
                if (data) {
                    data.pop()
                    _this.sig.fromData(data);
                }
            },
            addWaterMark(data) {
                var _this = this;
                if (!(Object.prototype.toString.call(data) == '[object Object]')) {
                    throw new Error("Expected Object, got " + typeof data + ".")
                } else {
                    var vCanvas = document.getElementById(_this.uid);
                    var textData = {
                        text: data.text || '',
                        x: data.x || 20,
                        y: data.y || 20,
                        sx: data.sx || 40,
                        sy: data.sy || 40
                    }

                    var ctx = vCanvas.getContext('2d');
                    ctx.font = data.font || '20px sans-serif';
                    ctx.fillStyle = data.fillStyle || "#333";
                    ctx.strokeStyle = data.strokeStyle || "#333";
                    if (data.style == 'all') {
                        ctx.fillText(textData.text, textData.x, textData.y);
                        ctx.strokeText(textData.text, textData.sx, textData.sx);
                    } else if (data.style == 'stroke') {
                        ctx.strokeText(textData.text, textData.sx, textData.sx);
                    } else {
                        ctx.fillText(textData.text, textData.x, textData.y);
                    }
                    _this.sig._isEmpty = false
                }
            }
        },
        mounted() {
            var _this = this;
            this.$nextTick(() => {
                _this.draw()
            });
        }
    })
    new Vue({
        data() {
            return {
                option: {
                    penColor: "rgb(0, 0, 0)"
                }
            };
        },
        methods: {
            save() {
                var _this = this;
                var png = _this.$refs.signature.save()
                var jpeg = _this.$refs.signature.save('image/jpeg')
                var svg = _this.$refs.signature.save('image/svg+xml');
                console.log(png);
                console.log(jpeg)
                console.log(svg)
            },
            clear() {
                var _this = this;
                _this.$refs.signature.clear();
            }
        }
    }).$mount('#app')




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


