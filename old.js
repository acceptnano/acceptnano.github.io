
var depositTextarea;
var continueButton;
var pattern = new RegExp("^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$");
var depositAddress = ""

function main() {
    console.log("hello world")
    depositTextarea = document.getElementById("deposit_address")
    continueButton = document.getElementById("continue_button")
    

    adjustTextarea()
    depositTextarea.focus();
}

function onResize() {
    adjustTextarea()
}

function adjustTextarea() {
    console.log("adjustTextarea")
    depositTextarea.value = depositTextarea.value.replace(/[^1-9a-zA-Z_]/g, '')
    resize_until_scrollbar_is_gone("textarea")
    checkAddressValidity()
}

function checkAddressValidity() {
    var address = depositTextarea.value
    var isValid = pattern.test(address)
    continueButton.disabled = !isValid
}

function resize_until_scrollbar_is_gone(selector) {
    // $.each($(selector), function (i, elem) {
    //     $(elem).height(1);
    //     while (elem.clientHeight < elem.scrollHeight) {
    //         $(elem).height($(elem).height() + 1);
    //     }
    // });
}

function pasteAddress(element) {
    navigator.clipboard.readText()
    .then(text => {
        console.log('Pasted content: ', text);
        depositTextarea.value = text;
        adjustTextarea();
    })
    .catch(err => {
        console.error('Failed to read clipboard contents: ', err);
    });
}

function requestAmount(element) {
    console.log("request amount")
}

function requestScreen() {
    depositAddress = depositTextarea.value
    $("#deposit_address_screen").hide();
    $("#request_screen").show();
    $("#address_info").attr("placeholder", depositAddress)
    adjustTextarea();
}

function changeCurrency(elem) {
    if (elem.placeholder == "NANO") {
        elem.placeholder = "VND"
    } else {
        elem.placeholder = "NANO"
    }
}
