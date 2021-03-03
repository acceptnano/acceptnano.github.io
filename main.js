var pattern = new RegExp("^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$");

function main() {
    $("#deposit_address_view").hide()
    var urlParams = new URLSearchParams(window.location.search);
    var address = urlParams.get('address');
    var isValid = pattern.test(address)
    console.log(isValid)
    if (isValid) {
        $("#deposit_address_view").hide()   
        $("#main_view").show()   
    } else {
        $("#deposit_address_view").show()   
        $("#main_view").hide()
        addressChanged()
    }
}

function addressContinue() {
    address = $("#address_textarea").val()
    window.location.href = "?address=" + address
}

function pasteAddress() {
    navigator.clipboard.readText()
    .then(text => {
        $("#address_textarea").val(text);
        addressChanged()
    })
    .catch(err => {
        console.error('Failed to read clipboard contents: ', err);
    });
}

function addressChanged() {
    var textarea = $("#address_textarea").get(0)
    address = textarea.value.toLowerCase()
    address = address.replace(/[^1-9a-z_]/g, '')
    textarea.value = address
    var isValid = pattern.test(address)
    $("#address_continue").get(0).disabled = !isValid
}