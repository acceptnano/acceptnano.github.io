
var currencySymbols = [
    "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN","BAM","BBD","BDT","BGN","BHD","BIF","BMD",
    "BND","BOB","BRL","BSD","BTC","BTN","BWP","BYN","BZD","CAD","CDF","CHF","CLF","CLP","CNH","CNY","COP",
    "CRC","CUC","CUP","CVE","CZK","DJF","DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP","GEL",
    "GGP","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL","HRK","HTG","HUF","IDR","ILS","IMP","INR","IQD",
    "IRR","ISK","JEP","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW","KWD","KYD","KZT","LAK","LBP",
    "LKR","LRD","LSL","LYD","MAD","MDL","MGA","MKD","MMK","MNT","MOP","MRO","MRU","MUR","MVR","MWK","MXN",
    "MYR","MZN","NAD","NANO","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR",
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
var usdToFiat = -1.0
var nanoToUsd = -1.0
var paymentHistory = null;
var pendingHistory = null;
var paymentHistoryShown = false;

function main() {
    var urlParams = new URLSearchParams(window.location.search);
    var address = urlParams.get('address');
    var hasAddress = urlParams.has('address');
    var isValid = pattern.test(address)
    var isEdit = urlParams.has('edit')
    var isSetCurrency = urlParams.has('set_currency')
    var hasCurreny = urlParams.has('currency')
    var currency = urlParams.get('currency')
    var isValidCurrency = currencySymbols.includes(currency);
    if (isValidCurrency) {
        fiatCurrency = currency;
    } else if (hasCurreny) {
        isSetCurrency = true;
    }

    if (isValid) {
        depositAddress = address
    }

    $("#deposit_address_view").hide()
    $("#main_view").hide()   
    $("#await_payment").hide()
    $("#payment_received").hide()
    $("#change_currency").hide()
    $("#currency_bottom").hide()
    $("#welcome_view").hide()

    if (isSetCurrency) {  
        $("#change_currency").show()
        initCurrencies();
    } else if (isValid && !isEdit) { 
        $("#main_view").show()
        initMainView()
    } else if (hasAddress) {
        $("#deposit_address_view").show()
        if (isEdit && isValid) {
            $("#address_textarea").get(0).value = address
        }
        addressChanged()
    } else {
        $("#welcome_view").show()
    }
}

function initMainView() {
    split = depositAddress.match(new RegExp('.{1,' + 24 + '}', 'g'));
    prefix = depositAddress.substring(0,11)
    suffix = depositAddress.slice(depositAddress.length - 6)
    $("#address_short").get(0).innerHTML = prefix + " . . . " + suffix
    $("#amount_currency").get(0).placeholder = fiatCurrency
    updateCurrencyRates();
    fetchPaymentHistory();
}

function updateCurrencyRates() {
    if (fiatCurrency == "NANO") {
        nanoToUsd = 1;
        usdToFiat = 1;
        return;
    }

    $.ajax({
        type: 'get',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=NANO&vs_currencies=USD',
        traditional: true,
        success: function(data){
            nanoToUsd = data.nano.usd
            console.log("nano usd: " + nanoToUsd)
            showPaymentHistory();
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
            usdToFiat = data.rates[fiatCurrency]
            console.log("fiat usd: " + usdToFiat)
            showPaymentHistory();
        },
        error: function(){
            console.error("Failed to fetch USD_" + fiatCurrency);
        },
    });
}

function fetchPaymentHistory() {
    $.ajax({
        type: 'get',
        url: "https://proxy.nanos.cc/proxy/?action=pending&count=5&threshold=1&source=true&account=" + depositAddress,
        traditional: true,
        success: function(data){
            console.log(data);
            pendingHistory = data;
            showPaymentHistory();
        },
        error: function(){
            console.error("Failed to fetch pending history");
        },
    });

    $.ajax({
        type: 'get',
        url: "https://proxy.nanos.cc/proxy/?action=account_history&count=20&account=" + depositAddress,
        traditional: true,
        success: function(data){
            console.log(data);
            paymentHistory = data;
            showPaymentHistory();
        },
        error: function(){
            console.error("Failed to fetch payment history");
        },
    });
}

function showPaymentHistory() {
    if (paymentHistory == null || pendingHistory == null || paymentHistoryShown) return;
    if (usdToFiat == -1.0 || nanoToUsd == -1.0) return;
    paymentHistoryShown = true;

    amountChanged();
    blocks = pendingHistory.blocks
    for (var key in blocks) {
        block = blocks[key]
        appendPendingDiv(block)
    }

    txs = paymentHistory.history
    for (i = 0; i < txs.length; i++) {
        tx = txs[i]
        if (tx.type == "receive") {
            appendPaymentHistoryDiv(tx);
        }
    }
}

function appendPendingDiv(block) {
    var amount = block.amount
    var source = block.source
    appendPaymentDiv(amount, source, null)
}

function appendPaymentHistoryDiv(tx) {
    appendPaymentDiv(tx.amount, tx.account, tx.local_timestamp)
}

function appendPaymentDiv(amount, source, timestamp) {
    var fromAccountPrefix = source.substring(0,11)

    var timeString = ""
    if (timestamp != null) {
        ts = new Date(parseInt(timestamp) * 1000);
        var secondsAgo = (new Date().getTime() - ts.getTime()) / 1000.0;
        var minutesAgo = secondsAgo / 60.0;
        var hoursAgo = minutesAgo / 60.0;
        var daysAgo = hoursAgo / 24.0;
        timeString = Math.round(secondsAgo) + "s ago";
        if (minutesAgo >= 1) timeString = Math.round(minutesAgo) + "m ago";
        if (hoursAgo >= 1) timeString = Math.round(hoursAgo) + "h ago";
        if (daysAgo >= 1) timeString = ts.toISOString().split('T')[0];
    }

    var rawAmount = parseFloat(amount);
    var nanoAmount = rawAmount / 1000000000000000000000000000000.0;
    nanoAmount = Math.round((nanoAmount + Number.EPSILON) * 1000000.0) / 1000000.0
    var fiatAmount = nanoAmount * nanoToUsd * usdToFiat;
    fiatAmount = Math.round((fiatAmount + Number.EPSILON) * 100.0) / 100.0
    if (fiatCurrency == "NANO") fiatAmount = nanoAmount

    var parent = $("#main_center").get(0)
    var paymentDiv = document.createElement("DIV");
    paymentDiv.classList.add("payment");
    var leftDiv = document.createElement("DIV");
    leftDiv.classList.add("left");
    var rightDiv = document.createElement("DIV");
    rightDiv.classList.add("right");
    var innerLeft = "Received <span class='highlight'>" + timeString + "</span><br>"
    if (timeString == "") {
        innerLeft = "Sent <br>"
    }
    innerLeft += "From <span class='highlight'>" + fromAccountPrefix + "...</span>"
    leftDiv.innerHTML = innerLeft;
    var nanoPart = nanoAmount + " NANO"
    if (fiatCurrency == "NANO") nanoPart = ""
    var innerRight = nanoPart + "<br><span class='highlight'>~ " + fiatAmount + " " + fiatCurrency + "</span>"
    if (fiatCurrency == "NANO") innerRight = innerRight.replace("~ ", "")
    rightDiv.innerHTML = innerRight;
    paymentDiv.appendChild(leftDiv);
    paymentDiv.appendChild(rightDiv);
    parent.appendChild(paymentDiv);
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
        parentDiv.appendChild(document.createElement("BR"))
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
    $("#currency_bottom").show();
}

function addressContinue() {
    address = $("#address_textarea").val()
    window.location.href = "?currency=" + fiatCurrency + "&address=" + address
}

function welcomeContinue() {
    window.location.href = "?set_currency&currency=USD&address="
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
    awaitPayment()
}

function awaitPayment() {
    $("#main_view").hide()
    $("#await_payment").show()
    history.pushState({}, "Accept Nano")
    window.onpopstate = function(e) {
        window.location.href = "?currency=" + fiatCurrency + "&address=" + depositAddress
    };

    usdRequestAmount = requestAmount / usdToFiat;
    nanoRequestAmount = usdRequestAmount / nanoToUsd;
    nanoRequestAmount = Math.round((nanoRequestAmount + Number.EPSILON) * 1000000.0) / 1000000.0

    text = "nano:" + depositAddress + "?amount=" + toRaw(nanoRequestAmount);
    console.log(text)
    var qrcode = new QRCode("qrcode", {
        text: text,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });

    var nanoPart = nanoRequestAmount.toString() + " NANO";
    if (fiatCurrency == "NANO") nanoPart = "";
    $("#nano_amount_info").get(0).innerHTML = nanoPart;
    fiatAmountInfo = "~ " + requestAmount.toString() + " " + fiatCurrency;
    if (fiatCurrency == "NANO") fiatAmountInfo = fiatAmountInfo.replace("~ ", "")
    $("#fiat_amount_info").get(0).innerHTML = fiatAmountInfo;
    openNanoWebSocket(nanoRequestAmount, requestAmount)
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
    currenciesReady = usdToFiat > 0 && nanoToUsd > 0
    $("#request_payment").get(0).disabled = invalidAmount && !currenciesReady
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
    return raw.replace(/^0+/, '')
}

function reload() {
    window.location.reload();
}

function editAddress() {
    window.location.href = "?edit&currency=" + fiatCurrency + "&address=" + depositAddress
}

function openNanoWebSocket(nanoRequestAmount, requestAmount) {
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
            if (rawReceived == toRaw(nanoRequestAmount)) {
                success(fromAddress, nanoRequestAmount, requestAmount);
                ws.close();
            }
        }
    }
}

function success(fromAddress, nanoRequestAmount) {
    var nanoPart = nanoRequestAmount + " NANO<br>~ "
    if (fiatCurrency == "NANO") nanoPart = "";

    $("#success_nano").get(0).innerHTML = nanoPart + requestAmount + " " + fiatCurrency;
    split = fromAddress.match(new RegExp('.{1,' + 24 + '}', 'g'));
    $("#success_address").get(0).innerHTML = split[0] + "<br>" + split[1] + "<br>" + split[2]
    $("#await_payment").hide()
    $("#payment_received").show()
}