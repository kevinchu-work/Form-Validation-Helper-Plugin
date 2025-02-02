/**
 * Form Validation Helper jQuery Plugin
 * Author: Kevin
 * Mar-2020
 *
 * Changelog:
 * Mar-2020 - Rewrite into ES6
 *
 * Features:
 * 1. Validation Form fields value based on type or Regex
 * 2. Display, focus, (and scroll to) error (or the first of) message
 * 3. Support validation of single field or all fields
 *
 * Special thanks to @publicJorn [Jorn Luiten] for the ES6 jQuery Plugins template
 */
(function(global, factory) {
  'use strict';


  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function($) {
      return factory($, global, global.document);
    });
  } else if (typeof exports === "object" && exports) {
    module.exports = factory(require('jquery'), global, global.document);
  } else {
    factory(jQuery, global, global.document);
  }
})(typeof window !== 'undefined' ? window : this, function($, window, document, undefined) {
  'use strict';

  const pluginName = 'FormHelper';

  // -- Globals (shared across all plugin instances)
  let settings = {};
  const defaultOptions = {
    // Component(s) default behavior
    disableSubmitBtn : true,
    errorHurdling    : false,
    // Development Related
    DEBUG_MODE : false,
  };

  // const $window = $(window);
  // const $document = $(document);

  // p = placeholder, together with pluginName
  const p = {};

  // Utilities Func
  const DEBUG   = (...params) => { settings.DEBUG_MODE && console.info ( "DEBUG:\n\t"   + params.toString() + "\n---"); }
  const ERROR   = (...params) => { settings.DEBUG_MODE && console.error( "ERROR:\n\t"   + params.toString() + "\n---"); }
  const WARNING = (...params) => { settings.DEBUG_MODE && console.warn ( "WARNING:\n\t" + params.toString() + "\n---"); }
  const isJSON  = (str) => {
    let jsonObj = undefined;
    try { jsonObj = JSON.parse(str); } catch (e) { return undefined; }
    return jsonObj;
  }

  // Regex Test Methods
  const validateEmail = (emailAddrString) => (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddrString));
  const validateTel = (phoneNumberString) => (/^[\+]?[(]?[0-9]{0,3}[)]?[-\s]?[0-9]{4}[-\s]?[0-9]{4,6}$/.test(phoneNumberString));

  // TODO: addition tag & type needs to be supported
  const supportedTag = ["INPUT", "TEXTAREA"/* , "SELECT" */];
  const supportedType = ["EMAIL", "TEL", "NUMBER"];
  const nameSpaceKey = pluginName.replace(/^\w/, c => c.toLowerCase())+"_";

  let $el;

  p[pluginName] = class {
    constructor (el, opts) {
      $el = $(el);
      settings = $.extend({}, defaultOptions, opts) ;
      // this._defaultOptions = defaultOptions;

      this.init();
    }

    init() {
      // Let's disable HTML5 default validation
      $el.attr("novalidate", "");


      // Preparing
      this.pairingErrorAndFields();
      DEBUG(pluginName+"("+$el.attr('id')+")"+' initialised');

      // this.eachField_forDebugging();

      if (settings.disableSubmitBtn) {
        // TODO: this needs to be handle together with "on_change" & "on_submit"
        $el.find('[type="submit"]').prop("disabled", true);
      }
      if (true) {
        // TODO: this needs to be handle together with "on_change" & "on_submit"
        $el.submit((e) => {
          e.preventDefault();

          this.resetFormError(e);
          this.validationLoop(e);

          return false;
        })
      }

    }


    /**
     * Perform a full test on specified form fields
     */
    validationLoop(e) {
      let $el = $(e.target);

      settings.DEBUG_MODE && console.log("Validation Loop: "+$el.attr("id"));

      $el.find(supportedTag.join(',')).each((idx, e) => {
        let rules = $(e).data(nameSpaceKey+"rules");
        let val = $(e).val();

        rules.forEach( r => {
          let result = this.validationDelegator(val, r);
          console.log("Testing["+$(e).attr("name")+": '"+val+"' with rule: '"+r+"'] = " + result);

          if (!result) {
            // Error show up
            let nameKey = $(e).attr("name");
            $(e).attr("aria-invalid", true);

            let errors = $el.find('error[errorFor="'+nameKey+'"][data-rule="'+r+'"], .error[errorFor="'+nameKey+'"][data-rule="'+r+'"]');
            if (errors.length == 1) {
              errors.addClass("errorShow");
            } else if (errors.length > 1) {
              $el.find('error[data-rule="'+r+'"], .error[data-rule="'+r+'"]').addClass("errorShow");
            } else {
              ERROR("Error message disappeared! Something wrong happened");
            }

            // return result;  // TODO: needs to handle "errorHurdling"
          }
        });
      });

      return false;
    }


    /**
     * Test single form field (or a single group like checkbox)
     * and then return validation result (true or false)
     *
     * p.s. for 'Required', 'email', 'tel' rule, string will be trim and test but other won't
     *
     * @param {string} val - Form Field value in text
     * @param {string} rule - Name (key) of validation rule, single value only
     */
    validationDelegator(val, rule) {

      // if (!val) {
      //   ERROR("Value to be tested is empty");
      //   return false;
      // }

      let r = rule.toLocaleLowerCase().replace(/\s/g, "");

      if (r === "required") {
        return (val.trim().length > 0);
      } else if (r === "email") {
        return validateEmail(val.trim());
      } else if (r === "tel") {
        return validateTel(val.trim());
      } else if (r.includes("max:")) {
        return val.trim() <= r.split(":")[1];
        // return false; //val.trim()
      } else {
        ERROR("Rule: "+r+" is not supported");
        return true;
      }
      return false;
    }


    // Link up error message to form fields
    pairingErrorAndFields() {

      // Gather all rules & store in Form Fields for future use
      $el.find(".error, error").each((idx, e) => {

        let inputTag = this.getTargetInputField(e);
        if (inputTag) {

          // Pairing by NAME tag
          let inputNameStr = $(inputTag).attr("name") || this.generateUUID_v4();
          $(e).data("errorFor", inputNameStr).attr("errorFor", inputNameStr);

          // Copy rules into input fields
          // 1. gathering all rules into single list (single source of truth)
          let errorRules = $(e).attr("data-rule") ? $(e).attr("data-rule").toLowerCase().split(',') : [];
          let rulesArr = $(inputTag).data(nameSpaceKey+"rules") || [];
          let finalRules = [...new Set(rulesArr.concat(errorRules))];  //Array
          // finalRules = finalRules.map((e) => { return e.replace(/\s/g, ""); /*.trim();*/ });  // remove all spaces
          // let finalRules = $.extend({}, errorRules, rulesJson); // JSON

          $(inputTag).data(nameSpaceKey+"rules", finalRules);
          if (settings.DEBUG_MODE) {
            // make it visible for debug
            $(inputTag).attr(nameSpaceKey+"rules", finalRules.join(","));
          }

          // mark input field as required, just in case
          if (errorRules.includes("required")) {
            $(inputTag).prop("required", true);
          }

          // Warning if input field has no NAME tag
          if ( ! $(inputTag).attr("name")) {
            $(inputTag).attr("name", inputNameStr);
            WARNING("Form field missing 'NAME' attribute, generated an UUID instead ["+inputNameStr+"]");
          }

        }

      });

      // Then scan form field(s) if any missing fules
      // TODO: future requirement, special rules defined in form field
      $el.find(supportedTag.join(',')).each((idx, e) => {
        let typeOfField = supportedType.includes( $(e).prop("type") ) ? $(e).prop("type") : "";
        let required = $(e).prop("required") ? "required" : "";
        // TODO: regex rules
        let existingRules = $(e).data(nameSpaceKey+"rules") || [];

        if (typeOfField != "")  { existingRules.push(typeOfField); }
        if (required != "")     { existingRules.push(required); }
        existingRules = [...new Set(existingRules)];

        $(e).data(nameSpaceKey+"rules", existingRules);
        if (settings.DEBUG_MODE) {
          $(e).attr(nameSpaceKey+"rules", existingRules.join(","));
        }

      });
    }

    // Keep looking for target until found
    getTargetInputField(e) {

      // Check if this fit of one of the case
      let hasErrorFor     = $(e).attr("errorFor") != undefined,
          afterInput      = supportedTag.includes( $(e).prev().prop("tagName") ),
          underErrorGroup = $(e).parent().prop("tagName") == "errorGroup".toUpperCase();
      let underErrorGroupWithForKey = (underErrorGroup && $(e).parent().attr("errorFor") !== undefined),
          underErrorGroupAfterInput = (underErrorGroup && supportedTag.includes( $(e).parent().prev().prop("tagName") ));

      // Return the actual input field
      if (hasErrorFor) {
        let nameKey = "[name='" + $(e).attr("errorFor") + "']" || "";
        return $(nameKey);

      } else if (afterInput) {
        return $(e).prev();

      } else if (underErrorGroupWithForKey) {
        let nameKey = "[name='" + $(e).parent().attr("errorFor") + "']";
        return $(nameKey);

      } else if (underErrorGroupAfterInput) {
        return $(e).parent().prev();
      }

      // Everything else is an issue, Exit
      console.error("Error message with no paired validation target:\n'"+$(e).text()+"'");
      return undefined;

    }
    // End of getTargetInputField() ~~~~~~~~~~~~~~~~~~~~~~~

    // Loop thru all form fields
    eachField_forDebugging() {
      // TODO: Move all debug logic to this umbrella
      $(supportedTag.join(',')).each((idx, e) => {
        let rules = $(e).data(nameSpaceKey+"rules") || [];
        settings.DEBUG_MODE && console.log($(e).attr("name"), rules);
      });

    }

    resetFormError(e) {
      let $el = $(e.target);
      $el.find(supportedTag.join(',')).attr("aria-invalid", false);
      // $el.find(supportedTag.join(',')).each(() => {
      //   $(this).attr("aria-invalid", false);
      // });
      $el.find("error.errorShow, .error.errorShow").removeClass("errorShow");
    }

    // TODO: replease the following method by npm UUID
    generateUUID_v4() {        // Public Domain/MIT
      let d = new Date().getTime();     // ***Timestamp, better use Date.now()
      let d2 = (performance && performance.now && (performance.now()*1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16;   //random number between 0 and 16
        if(d > 0){                    //Use timestamp until depleted
          r = (d + r)%16 | 0;
          d = Math.floor(d/16);
        } else {                      //Use microseconds since page-load if supported
          r = (d2 + r)%16 | 0;
          d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }
    // End of UUID_v4
  }

  // Clearup for bug trigger
  $el = undefined;
  // Avoid duplicated instantiations ~~~~~~~~~~~~~~~~~~~~~~
  $.fn[pluginName] = function(options) {
    return this.each(function () {
      if (!$.data(this, 'plugin_'+ pluginName)) {
        $.data(this, 'plugin_'+ pluginName, new p[pluginName](this, options));
      }
    });
  };
});