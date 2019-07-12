// DOM variable declarations
var serverURL = "https://ananda-spa-apitest.herokuapp.com";

// Initialize Vue instance

function testingVue() {
  console.log("accessed from HTML");
  Facialform.testing();
}

window.onload = function() {
  Vue.component("vue-signature", {
    template:
      '<canvas style="border:1px solid #000000;" :id="uid" class="signature canvas" :data-uid="uid"></canvas>',
    props: {
      sigOption: {
        type: Object,
        default: () => {
          return {
            backgroundColor: "rgb(255,255,255)",
            penColor: "rgb(0, 0, 0)"
          };
        }
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
        sig: () => {},
        option: {
          backgroundColor: "rgb(255,255,255)",
          penColor: "rgb(0, 0, 0)"
        },
        uid: ""
      };
    },
    created() {
      var _this = this;
      this.uid = "canvas" + _this._uid;
      var sigOptions = Object.keys(_this.sigOption);
      for (var item of sigOptions) {
        _this.option[item] = _this.sigOption[item];
      }
    },
    methods: {
      draw() {
        var _this = this;
        var canvas = document.getElementById(_this.uid);
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
          !_this.clearOnResize && url !== undefined && _this.fromDataURL(url);
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
        return format ? _this.sig.toDataURL(format) : _this.sig.toDataURL();
        // signaturePad.toDataURL(); // save image as PNG
        // signaturePad.toDataURL("image/jpeg"); // save image as JPEG
        // signaturePad.toDataURL("image/svg+xml"); // save image as SVG
      },
      fromDataURL(url) {
        var _this = this;
        _this.sig.fromDataURL(url);
      },
      isEmpty() {
        var _this = this;
        return _this.sig.isEmpty();
      },
      undo() {
        var _this = this;
        var data = _this.sig.toData();
        if (data) {
          data.pop();
          _this.sig.fromData(data);
        }
      },
      addWaterMark(data) {
        var _this = this;
        if (!(Object.prototype.toString.call(data) == "[object Object]")) {
          throw new Error("Expected Object, got " + typeof data + ".");
        } else {
          var vCanvas = document.getElementById(_this.uid);
          var textData = {
            text: data.text || "",
            x: data.x || 20,
            y: data.y || 20,
            sx: data.sx || 40,
            sy: data.sy || 40
          };

          var ctx = vCanvas.getContext("2d");
          ctx.font = data.font || "20px sans-serif";
          ctx.fillStyle = data.fillStyle || "#333";
          ctx.strokeStyle = data.strokeStyle || "#333";
          if (data.style == "all") {
            ctx.fillText(textData.text, textData.x, textData.y);
            ctx.strokeText(textData.text, textData.sx, textData.sx);
          } else if (data.style == "stroke") {
            ctx.strokeText(textData.text, textData.sx, textData.sx);
          } else {
            ctx.fillText(textData.text, textData.x, textData.y);
          }
          _this.sig._isEmpty = false;
        }
      }
    },
    mounted() {
      var _this = this;
      this.$nextTick(() => {
        _this.draw();
      });
    }
  });
  Vue.component("vue-parentsignature", {
    template:
      '<canvas style="border:1px solid #000000;" :id="uid" class="parentSignature canvas" :data-uid="uid"></canvas>',
    props: {
      sigOption: {
        type: Object,
        default: () => {
          return {
            backgroundColor: "rgb(255,255,255)",
            penColor: "rgb(0, 0, 0)"
          };
        }
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
        sig: () => {},
        option: {
          backgroundColor: "rgb(255,255,255)",
          penColor: "rgb(0, 0, 0)"
        },
        uid: ""
      };
    },
    created() {
      var _this = this;
      this.uid = "canvas" + _this._uid;
      var sigOptions = Object.keys(_this.sigOption);
      for (var item of sigOptions) {
        _this.option[item] = _this.sigOption[item];
      }
    },
    methods: {
      draw() {
        var _this = this;
        var canvas = document.getElementById(_this.uid);
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
          !_this.clearOnResize && url !== undefined && _this.fromDataURL(url);
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
        return format ? _this.sig.toDataURL(format) : _this.sig.toDataURL();
        // signaturePad.toDataURL(); // save image as PNG
        // signaturePad.toDataURL("image/jpeg"); // save image as JPEG
        // signaturePad.toDataURL("image/svg+xml"); // save image as SVG
      },
      fromDataURL(url) {
        var _this = this;
        _this.sig.fromDataURL(url);
      },
      isEmpty() {
        var _this = this;
        return _this.sig.isEmpty();
      },
      undo() {
        var _this = this;
        var data = _this.sig.toData();
        if (data) {
          data.pop();
          _this.sig.fromData(data);
        }
      },
      addWaterMark(data) {
        var _this = this;
        if (!(Object.prototype.toString.call(data) == "[object Object]")) {
          throw new Error("Expected Object, got " + typeof data + ".");
        } else {
          var vCanvas = document.getElementById(_this.uid);
          var textData = {
            text: data.text || "",
            x: data.x || 20,
            y: data.y || 20,
            sx: data.sx || 40,
            sy: data.sy || 40
          };

          var ctx = vCanvas.getContext("2d");
          ctx.font = data.font || "20px sans-serif";
          ctx.fillStyle = data.fillStyle || "#333";
          ctx.strokeStyle = data.strokeStyle || "#333";
          if (data.style == "all") {
            ctx.fillText(textData.text, textData.x, textData.y);
            ctx.strokeText(textData.text, textData.sx, textData.sx);
          } else if (data.style == "stroke") {
            ctx.strokeText(textData.text, textData.sx, textData.sx);
          } else {
            ctx.fillText(textData.text, textData.x, textData.y);
          }
          _this.sig._isEmpty = false;
        }
      }
    },
    mounted() {
      var _this = this;
      this.$nextTick(() => {
        _this.draw();
      });
    }
  });

  Vue.component("date-picker", {
    template: "<input/>",
    props: ["dateFormat"],
    mounted: function() {
      var self = this;
      $(this.$el).datepicker({
        //dateFormat: this.dateFormat,
        language: "en",
        view: "years",
        onSelect: function(date) {
          self.$emit("update-date", date);
        }
      });
    },
    beforeDestroy: function() {
      $(this.$el)
        .datepicker("hide")
        .datepicker("destroy");
    }
  });

  Vue.component("phone-us", {
    template: "<input/>",
    props: ["v-model"],
    mounted: function() {
      var self = this;
      $(this.$el).mask("(000) 000-0000", {
        onChange: function(phone) {
          self.$emit("update-phone", phone);
        }
      });
    }
  });

  function resize() {
    $(".parentSignature").outerHeight(
      $(window).height() -
        $(".parentSignature").offset().top -
        Math.abs(
          $(".parentSignature").outerHeight(true) -
            $(".parentSignature").outerHeight()
        )
    );
  }
  function resizesg() {
    $(".parentSignature").outerHeight(
      $(window).height() -
        $(".parentSignature").offset().top -
        Math.abs(
          $(".parentSignature").outerHeight(true) -
            $(".parentSignature").outerHeight()
        )
    );
  }
  $(document).ready(function() {
    resize();
    $(window).on("resize", function() {
      resize();
    });
    resizesg();
    $(window).on("resizesg", function() {
      resizesg();
    });
  });

  var Facialform = new Vue({
    el: "#vue-facial-form",
    data: {
      title: "This is a Form Demo",
      step: 1,
      id: 12000,
      clientid: 30425,
      createdate: Date,
      begin: {
        recommendation: "",
        groupon: "",
        business: ""
      },
      personal: {
        fullname: "",
        email: "",
        phone: "",
        address: "",
        city_zip_state: "",
        Birthdate: Date
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
        techniciandescription: ""
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
        skinsensitive: false
      },
      Minor: {
        parentName: "",
        parentSignature: ""
      },
      Errors: {
        recommendation: false,
        groupon: false,
        business: false,
        fullName: false,
        phone: false,
        email: false,
        email_duplicated: false,
        address: false,
        city_zip_state: false,
        Birthdate: false,
        parentName: false,
        parentSignature: false,
        pictures: false,
        signature: false
      },
      pictures: false,
      signature: "",
      option: {
        penColor: "rgb(0, 0, 0)"
      },
      grouponForm: false,
      parentsForm: false,
      submitbtnerror: false,
      submitbtn: "SUBMIT"
    },
    watch: {
      "personal.email": function() {
        var that = this;
        var reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (reEmail.test(this.personal.email) == false) {
          this.Errors.email = true;
        } else {
          if (this.parentsForm == false) {
            this.submitbtnerror = true;
            var email_lowercase = this.personal.email.toLowerCase();
            axios
              .post(serverURL + "/facial/checkemail", {
                body: {
                  email: email_lowercase
                }
              })
              .then(function(response) {
                console.log(response);
                console.log(JSON.stringify(response));
                if (response.status === 200) {
                  that.Errors.email = false;
                  that.Errors.email_duplicated = false;
                  that.submitbtnerror = false;
                }
                if (response.status === 409) {
                  that.Errors.email = true;
                  that.Errors.email_duplicated = true;
                  that.submitbtnerror = false;
                }
              });
          } else {
            this.Errors.email = false;
            this.Errors.email_duplicated = false;
          }
        }
      }
    },

    methods: {
      prev() {
        this.step--;
      },
      next() {
        if (this.validation() === 0) {
          this.step++;
        }
      },
      save() {
        var _this = this;
        var png = _this.$refs.signature.save();
        /* var jpeg = _this.$refs.signature.save('image/jpeg')
                var svg = _this.$refs.signature.save('image/svg+xml'); */
        signature = png.substring(22);
        console.log("this is valid signature var: " + signature);
        return signature;
      },
      clear() {
        var _this = this;
        _this.$refs.signature.clear();
      },
      isEmpty() {
        var _this = this;
        var empty = _this.$refs.signature.isEmpty();
        return empty;
      },
      saveparent() {
        var _this = this;
        var png = _this.$refs.parentsignature.save();
        /* var jpeg = _this.$refs.signature.save('image/jpeg')
                var svg = _this.$refs.signature.save('image/svg+xml'); */
        parentsignature = png.substring(22);
        console.log("this is valid signature var: " + parentsignature);
        return parentsignature;
      },
      clearparent() {
        var _this = this;
        _this.$refs.parentsignature.clear();
      },
      isEmptyparent() {
        var _this = this;
        var empty = _this.$refs.parentsignature.isEmpty();
        return empty;
      },
      updateDate: function(date) {
        this.personal.Birthdate = date;
        var age = this.calculateAge(date);
        if (age < 18) {
          this.parentsForm = true;
        } else {
          this.parentsForm = false;
        }
      },
      updatePhone: function(phone) {
        this.personal.phone = phone;
      },
      updateSubmitbtn(submitbtn) {
        this.submitbtn = submitbtn;
      },
      updateStep() {
        this.step++;
      },
      calculateAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      },
      validation() {
        var errors = 0;
        var isEmptyParent = false;
        var rePhone = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/;
        var reDate = /(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.](19|20)\d\d/;
        var reEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (this.step == 1) {
          if (this.parentsForm == true) {
            isEmptyParent = this.isEmptyparent();
          }

          if (this.begin.recommendation == "") {
            this.Errors.recommendation = true;
            $("#Recommendation-2").attr("style", "border: 1px solid #e21010;");
            errors++;
          } else {
            this.Errors.recommendation = false;
            $("#Recommendation-2").attr("style", "border: 1px solid #cccccc;");
          }
          if (this.begin.business == "") {
            this.Errors.business = true;
            $("#businesses").attr("style", "border: 1px solid #e21010;");
            errors++;
          } else {
            this.Errors.business = false;
            $("#businesses").attr("style", "");
          }
          if (this.grouponForm == "true") {
            if (this.begin.groupon == "") {
              this.Errors.groupon = true;
              $("#field-7").attr("style", "border: 1px solid #e21010;");
              errors++;
            } else {
              this.Errors.groupon = false;
              $("#field-7").attr("style", "border: 1px solid #cccccc;");
            }
          }
          if (this.personal.fullname == "") {
            this.Errors.fullName = true;
            errors++;
          } else {
            this.Errors.fullName = false;
          }
          if (rePhone.test(this.personal.phone) == false) {
            this.Errors.phone = true;
            $("#inputphone").addClass("error-focus");
            errors++;
          } else {
            this.Errors.phone = false;
            $("#inputphone").removeClass("error-focus");
          }
          if (reDate.test(this.personal.Birthdate) == false) {
            this.Errors.Birthdate = true;
            $("#inputdate").addClass("error-focus");
            errors++;
          } else {
            this.Errors.Birthdate = false;
            $("#inputdate").removeClass("error-focus");
          }
          if (this.Minor.parentName == "" && this.parentsForm == true) {
            this.Errors.parentName = true;
            errors++;
          } else {
            this.Errors.parentName = false;
          }
          if (isEmptyParent == true && this.parentsForm == true) {
            this.Errors.parentSignature = true;
            $(".parentSignature").attr(
              "style",
              "border: 2px solid rgb(162, 60, 111);touch-action: none;"
            );
            errors++;
          } else {
            this.Errors.parentSignature = false;
            $(".parentSignature").attr(
              "style",
              "border: 1px solid rgb(0, 0, 0); touch-action: none;"
            );
          }
          if (this.personal.address == "") {
            this.Errors.address = true;
            errors++;
          } else {
            this.Errors.address = false;
          }
          if (this.personal.city_zip_state == "") {
            this.Errors.city_zip_state = true;
            errors++;
          } else {
            this.Errors.city_zip_state = false;
          }
          if (reEmail.test(this.personal.email) == false) {
            this.Errors.email = true;
            errors++;
          }
          if (this.Errors.email == true) {
            errors++;
          }
          if (this.submitbtnerror == true) {
            errors++;
          }
        }
        if (this.step == 4) {
          if (this.pictures == false) {
            this.Errors.pictures = true;
            $("#chkPermission").addClass("error-div");
            errors++;
          } else {
            this.Errors.pictures = false;
            $("#chkPermission").removeClass("error-div");
          }
          if (this.isEmpty() == true) {
            this.Errors.signature = true;
            $(".signature").attr(
              "style",
              "border: 2px solid rgb(162, 60, 111);touch-action: none;"
            );
            errors++;
          } else {
            this.Errors.signature = false;
            $(".signature").attr(
              "style",
              "border: 1px solid rgb(0, 0, 0); touch-action: none;"
            );
          }
        }
        return errors;
      },
      submitform() {
        var that = this;
        if (this.validation() === 0) {
          this.submitbtn = "PROCESSING...";
          this.createdate = new Date();
          if (this.parentsForm == true) {
            this.Minor.parentSignature = this.saveparent();
          }
          axios
            .post(serverURL + "/facial/insert", {
              body: {
                id: this.id,
                clientid: this.clientid,
                createdate: this.createdate,
                fullname: this.personal.fullname,
                phone: this.personal.phone,
                address: this.personal.address,
                citystate: this.personal.city_zip_state,
                email: this.personal.email,
                datebirth: this.personal.Birthdate,
                wearcontact: this.health.wearcontact,
                surgery: this.health.surgery,
                surgerydescribe: this.health.surgerydescribe,
                skincancer: this.health.skincancer,
                dermatitis: this.health.dermatitis,
                keloidscarring: this.health.keloidscarring,
                acne: this.health.acne,
                rosacea: this.health.rosacea,
                broken: this.health.broken,
                treatment: this.health.treatment,
                hypo: this.health.hypo,
                hyperpig: this.health.hyperpig,
                burns: this.health.burns,
                anycondition: this.health.anycondition,
                anyconditiondescription: this.health.anyconditiondescription,
                allergies: this.health.allergies,
                latexallergies: this.health.latexallergies,
                otherallergies: this.health.otherallergies,
                otherallergiesdescription: this.health
                  .otherallergiesdescription,
                prescription: this.health.prescription,
                prescriptiondescription: this.health.prescriptiondescription,
                pregnant: this.health.pregnant,
                technician: this.health.technician,
                techniciandescription: this.health.techniciandescription,
                appointment: this.skincare.appointment,
                oftenfacials: this.skincare.oftenfacials,
                oftenbody: this.skincare.oftenbody,
                cosmetic: this.skincare.cosmetic,
                finelines: this.skincare.finelines,
                wrinkles: this.skincare.wrinkles,
                dull: this.skincare.dull,
                loss: this.skincare.loss,
                dry: this.skincare.dry,
                oily: this.skincare.oily,
                pores: this.skincare.pores,
                redness: this.skincare.redness,
                sensit: this.skincare.sensit,
                dark: this.skincare.dark,
                pimples: this.skincare.pimples,
                skin: this.skincare.skin,
                other: this.skincare.other,
                otherextradescription: this.skincare.otherextradescription,
                routine: this.homecare.routine,
                cleanser: this.homecare.cleanser,
                toner: this.homecare.toner,
                moisturizer: this.homecare.moisturizer,
                spf: this.homecare.spf,
                vitamin: this.homecare.vitamin,
                scrubs: this.homecare.scrubs,
                speciality: this.homecare.speciality,
                mask: this.homecare.mask,
                supplements: this.homecare.supplements,
                exercise: this.homecare.exercise,
                scar: this.homecare.scar,
                skinsensitive: this.homecare.skinsensitive,
                pictures: this.pictures,
                signature: this.save(),
                recommendation: this.begin.recommendation,
                groupon: this.begin.groupon,
                business: this.begin.business,
                parentname: this.Minor.parentName,
                parentsignature: this.Minor.parentSignature
              }
            })
            .then(function(response) {
              console.log(response);
              console.log(JSON.stringify(response));

              if (response.status === 200 || response.status === 409) {
                console.log(response.result);
                if (response.status === 200) {
                  var submitbt1 = "READY";
                  that.updateSubmitbtn(submitbt1);
                  that.updateStep();
                }
                if (response.status === 409) {
                  var submitbt2 = "TRY AGAIN";
                  that.updateSubmitbtn(submitbt2);
                }
              } else {
                var text = JSON.stringify(response.err);
                console.log(text);
                console.log(typeof text);
              }
            });
        }
      }
    },
    computed: {},
    filters: {}
  });
};
