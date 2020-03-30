# Form Validation Helper

jQuery plugins designed to simply HTML form validation and error message handling.

## Features

1. Validate form fields value based on destined type.
2. Display associated error message
3. Multiple validation rules & error message on same input field
4. Validation All fields at one OR one-by-one *(don't process the rest of field(s))*
5. Disable HTML5 default form validation feature

## Pending Festures

- Focus and/or scroll to the "first" input field if invalid
- Callback on validation pass
- Animation (or callback) of shows of error message
- Offload error message from HTML code
- Customizeable SCSS/CSS theme

## Install & Setup
```HTML
<link href="/dist/style/jQuery.FormHelper.core.min.css" rel="stylesheet">
<script src="/dist/jQuery.FormHelper.min.js"></script>

<!-- Optional, theme.css is customizable -->
<link href="/dist/style/jQuery.FormHelper.theme.min.css" rel="stylesheet">
```


## Usage

### Basic - Single validation rules & error message
```HTML
<!-- HTML -->
<form id="formID">
    <input type="email" id="emailAddr" required>
    <error>Please enter valid Email Address</error>
</form>
```

```javascript
// Initial
$("#formID").FormHelper();
```

### Multiple validation rules with associated error message
```HTML
<!--HTML -->
<form id="formID">
    <input type="email" id="emailAddr" required>
    <errorGroup>
        <error data-rule="requied">Please enter your Email address</error>
        <error data-rule="email">Email address is invalid, please check</error>
    </errorGroup>

    <input type="tel" id="mobilePhone" maxlength="14" minlength="6">
    <errorGroup>
        <error data-rule="len">Mobile phone number should be 6-14 digits</error>
    </errorGroup>
</form>
```
```javascript
// Initial with customized setting
$("#formID").FormHelper({
    errorHurdling : true,
    DEBUG_MODE    : true
});
```

## Available Options

Parameter        | Values (* is default) | Description
--- | --- | ---
`disableSubmitBtn` | *`true`/`false`         | `true`, disable all submit buttons under the form when plugin initial; `false`, keep submit button status untouch
`errorHurdling`    | *`false`/`true`         | `false`, stop validate the rest of field(s) when validation fail
`DEBUG_MODE`       | *`false`/`true`         | `true`, display necessary message to developer
