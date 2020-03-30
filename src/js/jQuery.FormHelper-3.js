/**
 * Form Validation Helper jQuery Plugin
 * Author: Kevin
 * Mar-2020
 *
 * Features:
 * 1. Validation Form fields value based on type or Regex
 * 2. Display, focus, (and scroll to) error (or the first of) message
 * 3. Support validation of single field or all fields
 *
 */

;(function($) {

  $.fn.FormHelper = function(options) {

    var settings = $.extend({

      // Component(s) default behavior
      disableSubmitBtn : true,
      errorHurdling    : false,

      // Development Related
      DEBUG_MODE : false,

    }, options);

    // Supported tag to be tested
    var supportedTag = ["INPUT", "TEXTAREA"/* , "SELECT" */];   // TODO: addition tag needs to be supported


    el = this;

    // Skip if init
    if ( $(el).data('FormHelper') != undefined ) {
      return $(el).data('FormHelper');
    }

    // Initial
    function init() {

      // Preparation Step
      prepare();

    }

    /**
     * 1. Find all error message
     * 2. Find all input field (maybe not necessary)
     * 3. Pair (1) & (2)
     * 4. Warn developer for missing links
     */
    function prepare() {

      // var errorTags = $(".error, error").toArray();
      // errorTags.forEach(function(e, idx) {
      $(".error, error").each(function(idx, e) {

        // Check if this fit of one of the case
        var hasErrorFor = $(e).attr("errorFor") != undefined,
            afterInput = supportedTag.indexOf( $(e).prev().prop("tagName") ) >= 0,
            underErrorGroup = $(e).parent().prop("tagName") == "errorGroup".toUpperCase();
        var underErrorGroupWithForKey = (underErrorGroup && $(e).parent().attr("errorFor") !== undefined),
            underErrorGroupAfterInput = (underErrorGroup
                                          &&
                                        supportedTag.indexOf(
                                          $(e).parent().prev().prop("tagName")
                                        ) >= 0);

        if ( !hasErrorFor && !afterInput && !underErrorGroupWithForKey && !underErrorGroupAfterInput) {
          console.error("Error message with no paired validation target\nError Tag["+(idx+1)+"]: '"+$(e).text()+"'");
        } else {

          // Pair them by ID
          var inputTag   = getTargetInputField(e);
          if (inputTag) {

            var inputIDStr = $(inputTag).attr("id") || generateUUID_v4();
            $(e).data("errorFor", inputIDStr);

            // Copy rules into input fields
            var errorRules = $(e).attr("data-rule") ? $(e).attr("data-rule").split(',') : [];
            var rulesArr = $(inputTag).data("rules") || [];
            $(inputTag).data("rules", rulesArr.concat(errorRules));

            // Warning if input field has no ID
            if ($(inputTag).attr("id") === undefined) {
              $(inputTag).attr("id", inputIDStr);
              DEBUG("Form field missing ID attribute, generated an UUID instead ["+inputIDStr+"]", 'error');
            }

          }

        }

      });

    }

    function getTargetInputField(err) {

      /* Keep looking for target until found */
      // TODO: handle tag not found error

      // Handle tag with "errorFor=xxx" at the beginning ~~~~~
      if ( typeof $(err).attr("errorFor") === "string") {
        //extract targeted ID right form "for"
        return $("#"+$(err).attr("errorFor"));

      } else if ( $(err).closest("errorGroup[errorFor]") !== undefined) {
        // extract "for" ID from errorGroup
        return $("#"+$(err).closest("errorGroup[errorFor]").attr("errorFor"));

      } else {
        // Handle tag without "errorFor=xxx" ~~~~~~~~~~~~~~~~~

        var checkTag = $(err).closest("errorGroup").prev().prop("tagName");

        // Look for errorGroup
        if ( typeof checkTag === "string" && supportedTag.indexOf(checkTag) >= 0 ) {
          return $(err).closest("errorGroup").prev();
        } else {
          // Look for prev input
          checkTag = $(err).prev().prop("tagName");
          if ( typeof checkTag === "string" && supportedTag.indexOf(checkTag) >= 0 ) {
            return $(err).prev();
          }
        }

      }

      // DEBUG("No related input field found! Please remember to assign 'errorFor' ID to <error> or <errorGroup> ", "error");
      DEBUG(["No related input field found!\nError: ", $(err).text()], "error");
      return undefined;
    }

    // Validation Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function validationHelper(fieldEle, /*errorEle,*/ ruleKey) {

      var val = "",
          result = false;

      if (fieldEle.prop("tagName").toLowerCase() == "input") {
        val = fieldEle.val().trim();
      }

      // Exit as no value
      if (val == "") { return false; }

      if (ruleKey == "email") {
        result = el.validateEmailString(val);
        DEBUG("Validation Helper: " + val + " - "+ruleKey+"("+ result +")");

      }

      return result;
    }


    // Public validation method for general use ~~~~~~~~~~~
    el.validateEmailString = function(emailAddr) {
      return (emailAddr.length == 0) || (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddr));
    }

    el.validateTelString = function (phoneNumberString) {
      // TODO: Add country support
      return (phoneNumberString.length == 0) || (/^[\+]?[(]?[0-9]{0,3}[)]?[-\s]?[0-9]{4}[-\s]?[0-9]{4,6}$/.test(phoneNumberString)); //easier
      // return (/^[\+]?[(]?[0-9]{0,3}[)]?[-\s]?[0-9]{3,4}[-\s]?[0-9]{4,6}$/.test(phoneNumberString));
    }
    // End: Validation Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Private Utilities Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~
    function toArray(obj) { return ( ! Array.isArray(obj) ) ? [obj] : obj; }

    function generateUUID_v4() {        // Public Domain/MIT
      var d = new Date().getTime();     // ***Timestamp, better use Date.now()
      var d2 = (performance && performance.now && (performance.now()*1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;   //random number between 0 and 16
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

    function DEBUG(msg, level) {
      if (settings.DEBUG_MODE) {
        toArray(msg).forEach(function(e) {
          (level == 'error') ? console.error(e) :
            (level == 'warn') ? console.warn(e) : console.log(e);
        });
      }
    }
    // End: Private Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Start the process
    init();
    $(el).data('FormHelper', this);

    return this;
  }

})(jQuery);

/**
TODO: Pending supported input type
email
number
text
tel
textarea - Required only

checkbox
time
date
file
image
password
month
range
radio
url
search
datetime-local
color
week

--hidden
--submit
--reset
*/
