const NUM_SHOW_MORE = 10;
const NUM_SHOW_LESS = 3;

function search(form) {
  var lowerPriceLimit = parseFloat(form.lowerPriceLimit.value);
  var upperPriceLimit = parseFloat(form.upperPriceLimit.value);
  if ((!isNaN(lowerPriceLimit)) && lowerPriceLimit < 0 ||
    (!isNaN(upperPriceLimit)) && upperPriceLimit < 0) {
    alert("Price range values cannot be negative! Please try a value greater than or equal to 0.0");
    return false;
  }
  if ((!isNaN(upperPriceLimit)) && (!isNaN(lowerPriceLimit)) && lowerPriceLimit > upperPriceLimit) {
    alert("Oops! lower price limit cannot be greater than upper price limit! Please try again.")
    return false;
  }

  var keyWords = form.inKeyWords.value;
  var condition = [];
  var conditionCheckboxes = document.getElementsByName("condition[]");
  for (var checkbox of conditionCheckboxes) {
    if (checkbox.checked)
      condition.push(checkbox.value)
  }
  var returnAccepted = document.getElementById("returnAccepted");
  var shippingFree = document.getElementById("shippingFree");
  var shippingExpedited = document.getElementById("shippingExpedited");
  var sortBy = form.inSortBy.value;


  searchFilters = {
    "keywords": keyWords,
    "sortOrder": sortBy,
    "MinPrice": lowerPriceLimit,
    "MaxPrice": upperPriceLimit,

    "ReturnsAcceptedOnly": returnAccepted.checked,
    "FreeShippingOnly": shippingFree.checked,
    "shippingExpedited": shippingExpedited.checked,
    "condition": condition,
  }

  var params = JSON.stringify(searchFilters);

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    console.log(this.readyState + ' ' + this.status)
    if (this.readyState == 4 && this.status == 200) {
      showSearchResults(this.responseText);
    }
  };

  try {
    xhttp.open("GET", "/search?params=" + params, true);
    xhttp.send();
  } catch (error) {
    alert("Met error with xhr!");
    return false;
  }
}

function showSearchResults(jsonResString) {
  var jsonRes = JSON.parse(jsonResString);
  var resultsNum = jsonRes.totalEntries;
  if (resultsNum === undefined) {
    document.getElementById("results").innerHTML = "<h2>Requests failed</h2>";
    return;
  }
  if (resultsNum === "0") {
    document.getElementById("results").innerHTML = "<h2>No results were found</h2>";
    return;
  }

  // build 2 global
  siftedItems = jsonRes.items;
  simplifiedCardHtmls = [];  // for cache
  for (var i = 0; i < siftedItems.length; i++) {
    simplifiedCardHtmls.push(makeSimplifiedCardHtml(i));
  }
  
  var html = "<h2>" + resultsNum + " Results found for <i>" + searchFilters["keywords"] + "</i></h2>"
  html += "<hr></hr>";
  html += simplifiedCardHtmls.slice(0, NUM_SHOW_LESS).join(" \n ");
  html += "<div id='showMore'></div>"
  html += '<button type="button" id="showButton" class="button" onclick="showMore()">Show More</button>'
  document.getElementById("results").innerHTML = html;
}

function makeTitle(item) {
  return "<a href='" + item.itemURL + "' target='_blank' onclick='event.stopPropagation();'><b>"
    + item.title + "</b></a>";
}

function makeCategory(item) {
  return "Catagory: <i>" + item.category + " </i>" +
    "<a href='" + item.itemURL + "' target='_blank' onclick='event.stopPropagation();'>" +
    "<img id='redirectImg' src='/static/img/redirect.png' alt='/static/img/redirect.png'>" +
    "</a>";
}

function makeCondition(item) {
  var html = "Condition: " + item.condition;
  if (item.isTopRated) {
    html += ' <img id="topRatedImg" src="/static/img/topRatedImage.png" alt="/static/img/topRatedImage.png">'
  }
  return html;
}

function makePrice(item) {
  var html = "<b>Price: $" + item.price + "</b>";
  if (parseFloat(item.shippingPrice) > 0) {
    html += "<b> ( + $" + item.shippingPrice + " for shipping)</b>";
  }
  return html;
}

function makeSimplifiedTextHtml(i) {
  var item = siftedItems[i];
  var html = "";
  html += makeTitle(item);
  html += "<br><br>";
  html += makeCategory(item);
  html += "<br><br>";
  html += makeCondition(item);
  html += "<br><br>";
  html += makePrice(item);
  return html;
}

function makeReturnAccept(item) {
  if (item.isReturnAccepted)
    return "Seller <b>accepts</b> returns";
  else
    return "Seller <b>does not accept returns</b>";
}

function makeShippingInfo(item) {
  var html = "";
  if (parseFloat(item.shippingPrice) === 0) {
    html += "Free Shipping";
  } else {
    html += "No Free Shipping";
  }
  if (item.isExpedited) {
    html += ' -- Expedited Shipping available';
  }
  return html;
}

function makeLocation(item) {
  return '<i> From ' + item.location + ' </i>';
}

function makeDetailedTextHtml(i) {
  var item = siftedItems[i];
  var html = "<span class='close' onclick='collapse(" + i.toString() + ")'></span>";
  html += makeTitle(item);
  html += "<br><br>";
  html += makeCategory(item);
  html += "<br><br>";
  html += makeCondition(item);
  html += "<br><br>";
  html += makeReturnAccept(item);
  html += "<br><br>";
  html += makeShippingInfo(item);
  html += "<br><br>";
  html += makePrice(item);
  html += makeLocation(item);
  return html;
}

function makeSimplifiedCardHtml(i) {
  var item = siftedItems[i];
  var html = "";
  html += "<div class='itemCard' onclick='unfold(" + i.toString() + ")'>";

  html += "<img class='image' src='" + item.imageURL + "' alt='" + item.imageURL + "'>";
  html += "<div class='text' id='itemText" + i.toString() + "'>";
  html += makeSimplifiedTextHtml(i);
  html += "</div>";

  html += "</div>";
  return html;
}

function collapse(i) {
  var itemTextElement = document.getElementById("itemText" + i.toString());
  itemTextElement.innerHTML = makeSimplifiedTextHtml(i);  // just text, so cache not adopted
  itemTextElement.style.overflow = 'hidden';
  itemTextElement.style["text-overflow"] = 'ellipsis';
  itemTextElement.style['white-space'] = 'nowrap';
  event.stopPropagation();
}

function unfold(i) {
  var itemTextElement = document.getElementById("itemText" + i.toString());
  itemTextElement.innerHTML = makeDetailedTextHtml(i);
  itemTextElement.style.overflow = 'visible';
  itemTextElement.style["text-overflow"] = 'clip';
  itemTextElement.style['white-space'] = 'normal';
}

// cannot override attributes
function showMore() {
  document.getElementById("showMore").innerHTML =
    simplifiedCardHtmls.slice(NUM_SHOW_LESS, NUM_SHOW_MORE).join('\n');

  var showButton = document.getElementById("showButton");
  showButton.remove();

  var showButton = document.createElement("button");
  showButton.innerHTML = "Show Less";
  showButton.setAttribute("id", "showButton");
  showButton.setAttribute("type", "button");
  showButton.setAttribute("class", "button");
  showButton.setAttribute('onclick', 'showLess()');
  document.getElementById("results").appendChild(showButton);

  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function showLess() {
  document.getElementById("showMore").innerHTML = "";

  var showButton = document.getElementById("showButton");
  showButton.remove();

  var showButton = document.createElement("button");
  showButton.innerHTML = "Show More";
  showButton.setAttribute("id", "showButton");
  showButton.setAttribute("type", "button");
  showButton.setAttribute("class", "button");
  showButton.setAttribute('onclick', 'showMore()');
  document.getElementById("results").appendChild(showButton);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}