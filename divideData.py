import json

with open('result.json', encoding='utf-8') as f:
    data = json.load(f)
    text = {"text": data["attention"]["all"]["left_text"]}
    for i, data in enumerate(data["attention"]["all"]["attn"]):
        for j, _ in enumerate(data["data"]):
            data["data"][j][0] = data["data"][j][0][:1]
            data["data"][j][1] = data["data"][j][1][:2]
            data["data"][j][2] = data["data"][j][2][:3]
            data["index"][j][0] = data["index"][j][0][:1]
            data["index"][j][1] = data["index"][j][1][:2]
            data["index"][j][2] = data["index"][j][2][:3]

        with open('data/layer_%s.json' % i, 'w') as layerFile:
            json.dump(data, layerFile)

    with open('data/text.json', 'w') as textFile:
        json.dump(text, textFile)

    with open('data/config.ini', 'w') as cfgFile:
        cfgFile.write('var nLayers = %s' % (i+1))