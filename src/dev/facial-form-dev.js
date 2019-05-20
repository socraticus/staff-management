// DOM variable declarations
var serverURL = 'https://ananda-spa-apitest.herokuapp.com';

// Initialize Vue instance


function testingVue() {
    console.log('accessed from HTML');
    Facialform.testing();
}





window.onload = function () {



    Vue.component('vue-signature', {
        template: '<canvas style="border:1px solid #000000;" :id="uid" class="canvas" :data-uid="uid"></canvas>',
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

    Vue.component('date-picker', {
        template: '<input/>',
        props: ['dateFormat'],
        mounted: function () {
            var self = this;
            $(this.$el).datepicker({
                //dateFormat: this.dateFormat,
                language: 'en',
                //minDate: new Date(), // Now can select only dates, which goes after today
                onSelect: function (date) {
                    self.$emit('update-date', date);
                }
            });
        },
        beforeDestroy: function () {
            $(this.$el).datepicker('hide').datepicker('destroy');
        }
    });

    Vue.component('phone-us', {
        template: '<input/>',
        props: ['v-model'],
        mounted: function () {
            var self = this;
            $(this.$el).mask(
              '(000) 000-0000',{
                onChange: function (phone) {
                    self.$emit('update-phone', phone);
                }
              }  
            );
        },
    });


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
            signature: "",
            option: {
                penColor: "rgb(0, 0, 0)"
            }

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
            save() {
                var _this = this;
                var png = _this.$refs.signature.save()
                /* var jpeg = _this.$refs.signature.save('image/jpeg')
                var svg = _this.$refs.signature.save('image/svg+xml'); */
                signature = png;
                console.log("this is valid signature var: " + signature);

            },
            clear() {
                var _this = this;
                _this.$refs.signature.clear();
            },
            updateDate: function (date) {
                this.personal.Birthdate = date;
            },
            updatePhone: function (phone) {
                this.personal.phone = phone;
            }
        },
        computed: {

        },
        filters: {

        }
    });




};


