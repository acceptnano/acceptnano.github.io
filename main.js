
var currencySymbols = [
    "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD",
    "BND","BOB","BRL","BSD","BTC","BTN","BWP","BYN","BZD","CAD","CDF","CHF","CLF","CLP","CNH","CNY","COP",
    "CRC","CUC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL",
    "GGP","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","IMP","INR","IQD",
    "IRR","ISK","JEP","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP",
    "LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRO","MRU","MUR","MVR","MWK","MXN",
    "MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR",
    "RON","RSD","RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLL","SOS","SRD","SSP","STD","STN",
    "SVC","SYP","SZL","THB","TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX","USD","UYU","UZS",
    "VES","VND","VUV","WST","XAF","XAG","XAU","XCD","XDR","XOF","XPD","XPF","XPT","YER","ZAR","ZMW","ZWL"
]

// https://www.coingecko.com/en/api#explore-api
// https://exchangerate.host/#/#docs

var pattern = new RegExp("^(nano|xrb)_[13]{1}[13456789abcdefghijkmnopqrstuwxyz]{59}$");
var depositAddress = ""
var requestAmount = 0.0
var fiatCurrency = ""
var selectedCurrency = ""
var fiatToUsd = -1.0
var usdToNano = -1.0

function main() {
    $("#deposit_address_view").hide()
    var urlParams = new URLSearchParams(window.location.search);
    var address = urlParams.get('address');
    var isValid = pattern.test(address)
    var isEdit = urlParams.has('edit')
    var isSetCurrency = urlParams.has('set_currency')
    var currency = urlParams.get('currency')
    var isValidCurrency = currencySymbols.includes(currency);
    if (isValidCurrency) {
        fiatCurrency = currency;
    } else {
        isSetCurrency = true;
    }

    if (isValid) {
        depositAddress = address
    }

    $("#deposit_address_view").hide()   
        $("#deposit_address_view").hide()   
    $("#deposit_address_view").hide()   
    $("#main_view").hide()   
    $("#await_payment").hide()
    $("#payment_received").hide()
    $("#change_currency").hide()
    if (isSetCurrency) {  
        $("#change_currency").show()
        initCurrencies();
    } else if (isValid && !isEdit) { 
        $("#main_view").show()
        split = depositAddress.match(new RegExp('.{1,' + 24 + '}', 'g'));
        $("#address_short").get(0).innerHTML = split[0] + "<br>" + split[1] + "<br>" + split[2]
        $("#amount_currency").get(0).placeholder = fiatCurrency
        updateCurrencyRates();
    } else {
        $("#deposit_address_view").show()
        if (isEdit && isValid) {
            $("#address_textarea").get(0).value = address
        }
        addressChanged()
    }
}

function updateCurrencyRates() {
    $.ajax({
        type: 'get',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=NANO&vs_currencies=USD',
        traditional: true,
        success: function(data){
            usdToNano = data.nano.usd
            console.log("nano usd: " + usdToNano)
        },
        error: function(){
            console.error("Failed to fetch NANO_USD");
        },
    });

    $.ajax({
        type: 'get',
        url: 'https://api.exchangerate.host/latest?base=USD&symbols=' + fiatCurrency,
        traditional: true,
        success: function(data){
            if (!data.success) {
                console.error("Failed to fetch USD_" + fiatCurrency);
            }
            fiatToUsd = data.rates[fiatCurrency]
            console.log("fiat usd: " + fiatToUsd)
        },
        error: function(){
            console.error("Failed to fetch USD_" + fiatCurrency);
        },
    });
}

function initCurrencies() {
    var parentDiv = $("#currency_list").get(0)
    for (i = 0; i < currencySymbols.length; i++) {
        var entryDiv = document.createElement("BUTTON");
        entryDiv.innerText = currencySymbols[i];
        entryDiv.name = currencySymbols[i];
        entryDiv.classList.add("button");
        entryDiv.classList.add("currency_button");
        entryDiv.onclick = function() {
            currencyOnClick(parentDiv, this);
        };
        parentDiv.appendChild(entryDiv);
    }
    buffer = document.createElement("DIV");
    buffer.classList.add("buffer");
    parentDiv.appendChild(buffer);
}

function currencyOnClick(parentDiv, entryDiv) {
    var all = parentDiv.children;
    for (var i = 0; i < all.length; i++) {
        var div = all[i];
        div.style.border = "none"
    }
    entryDiv.style.border = "0.2rem solid rgb(165,206,255)";
    selectedCurrency = entryDiv.name;
}

function addressContinue() {
    address = $("#address_textarea").val()
    window.location.href = "?currency=" + fiatCurrency + "&address=" + address
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

    $("#amount_info").get(0).innerHTML = requestAmount.toString() + " NANO"
    openNanoWebSocket()
}

function changeCurrency() {
    window.location.href = "?set_currency&currency=USD&address=" + depositAddress
}

function setCurrency() {
    if (!currencySymbols.includes(selectedCurrency)) return;
    window.location.href = "?currency=" + selectedCurrency + "&address=" + depositAddress
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

function openNanoWebSocket() {
    var ws = new WebSocket("wss://socket.nanos.cc", []);
    ws.onopen = function (event) {
        console.log("on open!");
        const confirmation_subscription = {
            "action": "subscribe", 
            "topic": "confirmation",
            "options": {
                "accounts": [depositAddress]
            }
        }
        ws.send(JSON.stringify(confirmation_subscription));
    };

    ws.onmessage = function (event) {
        console.log(event.data);
        obj = JSON.parse(event.data);
        if (obj.message != undefined) {
            fromAddress = obj.message.account
            rawReceived = obj.message.amount
            if (rawReceived == toRaw(requestAmount)) {
                success(fromAddress, requestAmount);
                ws.close();
            }
        }
    }
}

function success(fromAddress, requestAmount) {
    $("#success_nano").get(0).innerHTML = requestAmount + " NANO";
    split = fromAddress.match(new RegExp('.{1,' + 24 + '}', 'g'));
    $("#success_address").get(0).innerHTML = split[0] + "<br>" + split[1] + "<br>" + split[2]
    $("#await_payment").hide()
    $("#payment_received").show()
}