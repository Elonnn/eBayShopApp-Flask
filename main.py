from flask import Flask, request, jsonify
from json import loads, dumps
from urllib.parse import urlencode
import requests

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)


@app.route('/')
def homepage():
    return app.send_static_file("eBayShopping.html")


@app.route('/search')
def search():
    # one example url is:
    # https: // svcs.ebay.com / services / search / FindingService / v1?OPERATION - NAME = findItemsAdvanced
    # & SERVICE - VERSION = 1.0.0 & SECURITY-APPNAME = YilangXu-CSCI571h - PRD - b2eb84a53 - 40467988
    # & RESPONSE - DATA - FORMAT = JSON & REST - PAYLOAD
    # & keywords = iphone
    # & paginationInput.entriesPerPage = 25 & sortOrder = BestMatch
    # & itemFilter(0).name = MaxPrice & itemFilter(0).value = 25
    # & itemFilter(0).paramName = Currency & itemFilter(0).paramValue = USD
    # & itemFilter(1).name = MinPrice & itemFilter(1).value = 10
    # & itemFilter(1).paramName = Currency & itemFilter(1).paramValue = USD
    # & itemFilter(2).name = ReturnsAcceptedOnly & itemFilter(2).value = false
    # & itemFilter(3).name = Condition & itemFilter(3).value(0) = 2000
    # & itemFilter(3).value(1) = 3000
    url = "https://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced" \
          "&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=YilangXu-CSCI571h-PRD-b2eb84a53-40467988" \
          "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD" \
          "&paginationInput.entriesPerPage=25"
    paramsString = request.args.get('params', -1)
    params = loads(paramsString)

    paramsEbay = {'keywords': params["keywords"], 'sortOrder': params["sortOrder"]}
    filterNum = 0
    if params['MinPrice'] is not None:
        paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "MinPrice"
        paramsEbay["itemFilter(" + str(filterNum) + ").value"] = params["MinPrice"]
        filterNum += 1
    if params['MaxPrice'] is not None:
        paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "MaxPrice"
        paramsEbay["itemFilter(" + str(filterNum) + ").value"] = params["MaxPrice"]
        filterNum += 1
    paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "ReturnsAcceptedOnly"
    paramsEbay["itemFilter(" + str(filterNum) + ").value"] = params['ReturnsAcceptedOnly']
    filterNum += 1
    paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "FreeShippingOnly"
    paramsEbay["itemFilter(" + str(filterNum) + ").value"] = params['FreeShippingOnly']
    filterNum += 1
    if params['shippingExpedited']:
        paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "ExpeditedShippingType"
        paramsEbay["itemFilter(" + str(filterNum) + ").value"] = "Expedited"
        filterNum += 1
    if params['condition']:
        paramsEbay["itemFilter(" + str(filterNum) + ").name"] = "Condition"
        for i, v in enumerate(params['condition']):
            paramsEbay["itemFilter(" + str(filterNum) + ").value(" + str(i) + ")"] = v
        filterNum += 1
    url += '&' + urlencode(paramsEbay)
    # or one can use
    # r = requests.get('https://httpbin.org/get', params=payload)

    try:
        response = requests.get(url=url)  # response object
        # response.headers['Cache-Control'] = 'no-store'
        # response.headers['Pragma'] = 'no-cache'
    except Exception as e:
        error = {"status": "error"}
        return dumps(error)

    data = response.json()
    MAX_NUM_RETURN = 10
    res = {"totalEntries": '0', "items": []}
    if ("findItemsAdvancedResponse" not in data) or ("paginationOutput" not in data["findItemsAdvancedResponse"][0]) \
            or ('totalEntries' not in data["findItemsAdvancedResponse"][0]["paginationOutput"][0]) \
            or data["findItemsAdvancedResponse"][0]["paginationOutput"][0]['totalEntries'][0] == '0':
        return dumps(res)

    res['totalEntries'] = data["findItemsAdvancedResponse"][0]["paginationOutput"][0]['totalEntries'][0]  # string
    items = data["findItemsAdvancedResponse"][0]["searchResult"][0]["item"]
    for item in items:
        try:
            title = item["title"][0]
            condition = item['condition'][0]['conditionDisplayName'][0]
            category = item['primaryCategory'][0]['categoryName'][0]
            itemURL = item['viewItemURL'][0]
            price = item['sellingStatus'][0]['convertedCurrentPrice'][0]['__value__']
            shippingPrice = item['shippingInfo'][0]['shippingServiceCost'][0]['__value__']
            location = item['location'][0]
            isReturnAccepted = item['returnsAccepted'][0] == 'true'
            isTopRated = item['topRatedListing'][0] == 'true'
            isExpedited = item['shippingInfo'][0]['expeditedShipping'][0] == 'true'
            imageURL = item['galleryURL'][0]
        except Exception as e:
            print(item)  # for search of N95 antivirus, shippingServiceCost field is missing.
            continue
        if imageURL == "https://thumbs1.ebaystatic.com/pict/04040_0.jpg":
            imageURL = '/static/img/ebay_default.jpg'
        res['items'].append({
            'title': title, 'condition': condition, 'category': category,
            'itemURL': itemURL, 'price': price, 'shippingPrice': shippingPrice,
            'location': location, 'isReturnAccepted': isReturnAccepted,
            'isTopRated': isTopRated, 'isExpedited': isExpedited, 'imageURL': imageURL
        })
        if len(res['items']) == MAX_NUM_RETURN:
            break

    return dumps(res)


# this has to be put in the end
if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="localhost", port=8080, debug=True)
# [END gae_python37_app]
