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
    var supportedTag = ["input", "textarea"];   // TODO: addition tag needs to be supported


    el = this;

    // Initial
    function init() {

      // Return if initialized
      if ($(el).data('FormHelper')) { return; }

      DEBUG(["FormHelper Configuration: ", settings]);

      // Let's disable HTML5 default validation
      el.attr("novalidate", "");

      // Focus disable submit button at the beginning
      if ( settings.disableSubmitBtn ) {
        el.find('[type="submit"]').prop('disabled', true);
      }

      // Check missing ID of supported Node/Tag and warn developer
      var missingID = $( supportedTag.join(',') ).toArray()   // TODO: checking method may need to adjust when more supported tag type
                                                  .filter(function(i) {
                                                    return $(i).attr("id") == undefined
                                                  })
                                                  .length;
      if (missingID > 0) { console.warn('Input field with missing ID! Error message can\'t be show correctly.') }

      // Prepare all Error message and pair to input element
      errorPrepare();


      // Inject validation functions
      el.submit(function(e) {
        e.preventDefault();

        // Reset all error before validation
        resetFormError();

        // TODO: hurdling mode - multi error maybe occur, display handling
        var reqFlag = scanRequired(settings.errorHurdling);
        var regFlag = scanRegex(settings.hurdling);

        if (settings.DEBUG_MODE) {
          return false;
        }

        return reqFlag && regFlag;

      });

    }


    // Major functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    /**
     * Scan input field one by one and if error occur, toggle aria-invalid
     * @param {boolean} hurdling - True, continue scanning even error occur; False (default), stop scaning when any (kind of) error occur
     *
     * TODO:
     * 1. Return mode selection (Return input field or toggle aria-invalid)
     * 2. Multi-Error message handling
     */
    function scanRequired(hurdling) {

      var fields = el.find('[required], [aria-required="true"]');
      var result = true;

      // if nothing to do
      if (fields.length == 0) {
        DEBUG('No input field is compulsory (p.s. <input required> or <input aria-required="true">)');
        return true;
      }

      fields.each(function(i,e) {
        if ( e.value.trim().length == 0 ) {

          DEBUG("scanRequired: "+e.id);
          $(e).attr('aria-invalid', 'true');

          // Check if errorGroup exist
          var errGrp = $('errorGroup[for="'+e.id+'"]');
          if ( errGrp.length ) {
            DEBUG("errorGroup found");
            errGrp.find('[data-rule="required"]').addClass("errorShow");
          } else {

              switch ( $(e).next().prop("tagName") ) {
                case "ERRORGROUP":
                  $(e).next().find('[data-rule*="required"]').addClass("errorShow");
                  break;
                case "ERROR":
                  $(e).next().addClass("errorShow");
                  break;
                default:
                  DEBUG("No related error message found!", "error");
                  break;

            }


          }

          if ( ! hurdling )
            return false;   // Stop scaning based on hurdling mode
          else
            result = false;
        }
      });
      return result;
    }


    /**
     * Test input field one by one based on the expended format of value
     * @param {boolean} hurdling - True, continue scanning even error occur; False (default), stop scaning when any (kind of) error occur
     *
     */
    function scanRegex(hurdling) {

      $('[data-rule]').each(function(i,rulesInTag) {

        // DEBUG(['scanRegex: ', rulesInTag]);

        var suspect = getTargetInputField(rulesInTag);
        // DEBUG(['scanRegex suspect: ', suspect]);

        if (suspect != null) {

          // Gather all the rules that needs to be test

          // Rules from error tag
          var ruleArr = $(rulesInTag).attr("data-rule").split(',');
          // Rules from input field, if any
          var ruleFromSuspect = (typeof suspect.attr("data-rule") == "string") ?
                                    suspect.attr("data-rule").split(',') : [];
          if ( supportedTag.indexOf( suspect.attr("type") ) >= 0 ) {
            ruleFromSuspect.push( suspect.attr("type") );
          }

          // Combine, remove duplication, remove Required
          ruleArr = ruleArr.concat(ruleFromSuspect)
                            .map(function(t){return t.trim()})
                            // .filter(function(v){return v != "required"})
                            .filter(function(item, pos, self) {
                              return ((self.indexOf(item) == pos) && (item != "required"));
                            });


          // Start the Polygraph
          ruleArr.forEach(function(ruleKey) {

            if ( !validationHelper(suspect, ruleKey) ) {
              suspect.attr("aria-invalid", "true");
              $(rulesInTag).addClass("errorShow");

              if ( !settings.errorHurdling ) { return; }
            }

          });
        }

      });

    }
    // End: Major functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Validation Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function validatorDelegate(fieldEle, /*errorEle,*/ ruleKey) {

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

    // Public validation method for general use
    el.validateEmailString = function(emailAddr) {
      return (emailAddr.length == 0) || (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailAddr));
    }

    el.validateTelString = function (phoneNumberString) {
      // TODO: Add country support
      return (phoneNumberString.length == 0) || (/^[\+]?[(]?[0-9]{0,3}[)]?[-\s]?[0-9]{4}[-\s]?[0-9]{4,6}$/.test(phoneNumberString)); //easier
      // return (/^[\+]?[(]?[0-9]{0,3}[)]?[-\s]?[0-9]{3,4}[-\s]?[0-9]{4,6}$/.test(phoneNumberString));
    }
    // End: Validation Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    // Private Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function errorPrepare() {

      // TODO: Should data key be customizable?
      var forKeyPrefix = "errorFor";



      // Gather all rules & error message
      // Pair input field, one by one
      $("[data-rule], error, .error").toArray().forEach(function(item, idx, arr) {

        // Check if pair exist
        if ( $(item).data(forKeyPrefix) === undefined ) {

          var elementIterator;

          // is it under <errorGroup>?
          elementIterator = $(item).parent();
          if ( elementIterator.prop("tagName") == "ERRORGROUP" ) {

            // Yes, under <errorGroup>
            if ( elementIterator.attr('data-errorFor') != undefined ) {
              $(item).data(forKeyPrefix, elementIterator.attr('data-errorFor'));
              if (settings.DEBUG_MODE) {
                $(item).attr(forKeyPrefix, elementIterator.attr('data-errorFor'));
              }

              // TODO: check input field exist before assign
            } else {
              // does input placed ahead?
              var checkPrevSibling = elementIterator.prev();
              if ( supportedTag.indexOf( checkPrevSibling.prop("tagName") ) >= 0 ) {
                // Yes, it is input field
                $(item).data(forKeyPrefix, checkPrevSibling.attr('id') );
                if (settings.DEBUG_MODE) {
                  $(item).attr(forKeyPrefix, checkPrevSibling.attr('id') )
                }
              }
            }

          } else {
            // No, no under <errorGroup>
            elementIterator = $(item).prev();
            if ( supportedTag.indexOf( elementIterator.prop("tagName")) >= 0) {
              $(item).data(forKeyPrefix, elementIterator.attr("id"));
              if (settings.DEBUG_MODE) {
                $(item).attr(forKeyPrefix, elementIterator.attr("id"));
              }
            }
          }

        }

      });

    }

    function getTargetInputField(e) {

      /* Keep looking for target until found */

      // Handle tag with "data-errorFor=xxx" at the beginning ~~~~~
      if ( typeof $(e).attr("data-errorFor") === "string") {
        //extract targeted ID right form "for"
        return $("#"+$(e).attr("data-errorFor"));

      } else if ( $(e).closest("errorGroup[data-errorFor]").length > 0) {
        // extract "for" ID from errorGroup
        return $("#"+$(e).closest("errorGroup[data-errorFor]").attr("data-errorFor"));

      } else {
        // Handle tag without "data-errorFor=xxx" ~~~~~~~~~~~~~~~~~

        var checkTag = $(e).closest("errorGroup").prev().prop("tagName");

        // Look for errorGroup
        if ( typeof checkTag === "string" && supportedTag.indexOf(checkTag.toLowerCase()) >= 0 ) {
          return $(e).closest("errorGroup").prev();
        } else {
          // Look for prev input
          checkTag = $(e).prev().prop("tagName");
          if ( typeof checkTag === "string" && supportedTag.indexOf(checkTag.toLowerCase()) >= 0 ) {
            return $(e).prev();
          }
        }

      }

      DEBUG("No related input field found! Please remember to assign 'for' ID to <error> or <errorGroup> ", "error");
      return null;
    }

    function resetFormError() {
      // Reset Input field
      el.find('[aria-invalid="true"]').removeAttr("aria-invalid");

      // Reset Error Message
      $("error.errorShow, .error.errorShow").removeClass("errorShow");
    }

    function toArray(obj) { return ( ! Array.isArray(obj) ) ? [obj] : obj; }

    function DEBUG(msg, level) {
      if (settings.DEBUG_MODE) {
        toArray(msg).forEach(function(e) {
          (level == 'error') ? console.error(e) :
            (level == 'warn') ? console.warn(e) : console.log(e);
        });
      }
    }
    // End: Private Methods ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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

hidden
submit
reset
 */