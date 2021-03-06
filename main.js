var pattern = new RegExp("^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$");
var depositAddress = ""
var requestAmount = 0.0

function main() {
    $("#deposit_address_view").hide()
    var urlParams = new URLSearchParams(window.location.search);
    var address = urlParams.get('address');
    var isValid = pattern.test(address)
    var isEdit = urlParams.has('edit')
    if (isValid && !isEdit) {
        depositAddress = address
        $("#deposit_address_view").hide()   
        $("#main_view").show()   
        $("#await_payment").hide()

        split = depositAddress.match(new RegExp('.{1,' + 24 + '}', 'g'));
        $("#address_short").get(0).innerHTML = split[0] + "<br>" + split[1] + "<br>" + split[2]
    } else {
        $("#deposit_address_view").show()   
        $("#main_view").hide()
        $("#await_payment").hide()
        if (isEdit && isValid) {
            $("#address_textarea").get(0).value = address
        }
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

function requestPayment() {
    $("#request_payment").get(0).disabled = true;
    // $.ajax({
    //     type: 'post',
    //     url: 'https://gonano.dev/payment/new',
    //     contentType: "application/json; charset=utf-8",
    //     traditional: true,
    //     data: JSON.stringify({
    //         "account": depositAddress,
    //         "amount": requestAmount,
    //     }),
    //     success: function(data){
    //         var id = data["id"];
    //         var account = data["account"];
    //         awaitPayment(id, account);
    //     },
    //     error: function(){
    //         console.error("Failed to request a payment!");
    //     },
    // });
    awaitPayment("23213", "2323")
}

function awaitPayment(id, account) {
    $("#main_view").hide()
    $("#await_payment").show()
    history.pushState({}, "Accept Nano")
    window.onpopstate = function(e) {
        window.location.href = "?address=" + depositAddress
    };

    text = "nano:" + depositAddress + "?amount=" + toRaw(requestAmount);
    var qrcode = new QRCode("qrcode", {
        text: text,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });
}

function changeCurrency() {

}

function amountChanged() {
    amount = $("#amount").get(0).value
    amountFloat = parseFloat(amount)
    invalidAmount = (amount == "" || amountFloat == 0.0)
    $("#request_payment").get(0).disabled = invalidAmount
    if (!invalidAmount) {
        requestAmount = amountFloat;
    }
}

function toRaw(amount) {
    var zeros = 31
    var raw = amount.toString()
    var split = raw.split('.')
    if (split.length > 1) {
        zeros = zeros - split[1].length
        raw = split[0] + split[1]
    }
    raw = raw + (new Array(zeros)).join('0');
    return raw
}

function reload() {
    window.location.reload();
}

function editAddress() {
    window.location.href = "?edit&address=" + depositAddress
}